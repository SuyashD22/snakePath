import random
from fastapi import APIRouter, HTTPException
from database import get_connection, release_connection
from models import (
    GameSetup, GameState, TeamConfig, PendingApproval, 
    RollSubmit, VerdictRequest
)

router = APIRouter(prefix="/api")

# In-memory question cache to prevent DB connection pool exhaustion on 30 simultaneous rolls
QUESTIONS_CACHE = None

@router.get("/state", response_model=GameState)
def get_state():
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="DB Error")
    
    try:
        cursor = conn.cursor()
        # Read game_config
        cursor.execute("SELECT num_teams, game_started FROM game_config WHERE id=1;")
        config_row = cursor.fetchone()
        num_teams = config_row[0] if config_row else 3
        game_started = config_row[1] if config_row else False
        
        # Read teams
        cursor.execute("SELECT id, name, password, color, avatar, position, dice_unlocked, waiting_for_approval FROM teams ORDER BY id;")
        teams = []
        for row in cursor.fetchall():
            teams.append(TeamConfig(
                id=row[0], name=row[1], password=row[2], color=row[3], avatar=row[4],
                position=row[5], diceUnlocked=row[6], waitingForApproval=row[7]
            ))
            
        # Read pending_approvals
        cursor.execute("SELECT id, team_id, team_name, team_color, roll, from_position, question_id, question_title, question_difficulty, question_link, timestamp FROM pending_approvals ORDER BY timestamp ASC;")
        pending = []
        for row in cursor.fetchall():
            pending.append(PendingApproval(
                id=row[0], teamId=row[1], teamName=row[2], teamColor=row[3], roll=row[4],
                fromPosition=row[5], questionId=row[6], questionTitle=row[7],
                questionDifficulty=row[8], questionLink=row[9], timestamp=row[10]
            ))
            
        conn.commit()
        cursor.close()
        return GameState(
            numTeams=num_teams,
            gameStarted=game_started,
            teams=teams,
            pendingApprovals=pending
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            release_connection(conn)

@router.post("/admin/setup")
def setup_game(setup: GameSetup):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="DB Error")
    
    try:
        cursor = conn.cursor()
        
        # Reset current tables
        cursor.execute("TRUNCATE TABLE teams CASCADE;")
        cursor.execute("TRUNCATE TABLE pending_approvals CASCADE;")
        
        # Update config
        cursor.execute("UPDATE game_config SET num_teams = %s, game_started = %s WHERE id = 1;", 
                       (setup.numTeams, setup.gameStarted))
                       
        # Insert new teams
        for t in setup.teams:
            cursor.execute("""
                INSERT INTO teams (id, name, password, color, avatar, position, dice_unlocked, waiting_for_approval)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (t.id, t.name, t.password, t.color, t.avatar, t.position, t.diceUnlocked, t.waitingForApproval))
            
        conn.commit()
        cursor.close()
        return {"status": "success"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            release_connection(conn)

@router.post("/admin/reset")
def reset_game():
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="DB Error")
    try:
        cursor = conn.cursor()
        cursor.execute("TRUNCATE TABLE teams CASCADE;")
        cursor.execute("TRUNCATE TABLE pending_approvals CASCADE;")
        cursor.execute("UPDATE game_config SET num_teams = 3, game_started = FALSE WHERE id = 1;")
        conn.commit()
        cursor.close()
        return {"status": "success"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            release_connection(conn)

@router.post("/team/roll")
def log_roll(roll: RollSubmit):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="DB Error")
        
    try:
        cursor = conn.cursor()
        # Ensure we only log one roll per team
        cursor.execute("DELETE FROM pending_approvals WHERE team_id = %s;", (roll.teamId,))
        
        cursor.execute("""
            INSERT INTO pending_approvals (team_id, team_name, team_color, roll, from_position, question_id, question_title, question_difficulty, question_link, timestamp)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            roll.teamId, roll.teamName, roll.teamColor, roll.roll, roll.fromPosition, 
            roll.questionId, roll.questionTitle, roll.questionDifficulty, roll.questionLink, roll.timestamp
        ))
        
        # Update team state
        cursor.execute("""
            UPDATE teams SET dice_unlocked = FALSE, waiting_for_approval = TRUE WHERE id = %s
        """, (roll.teamId,))
        
        conn.commit()
        cursor.close()
        return {"status": "success"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            release_connection(conn)

@router.post("/admin/verdict")
def roll_verdict(verdict: VerdictRequest):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="DB Error")
        
    try:
        cursor = conn.cursor()
        
        # Update team position and reset dice
        cursor.execute("""
            UPDATE teams SET position = %s, dice_unlocked = TRUE, waiting_for_approval = FALSE WHERE id = %s
        """, (verdict.newPos, verdict.teamId))
        
        # Delete from pending
        cursor.execute("DELETE FROM pending_approvals WHERE team_id = %s;", (verdict.teamId,))
        
        conn.commit()
        cursor.close()
        return {"status": "success"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            release_connection(conn)

@router.get("/questions/random")
def get_random_question(position: int = 0):
    r = random.random()
    if position <= 50:
        difficulty = 'easy' if r < 0.5 else 'medium' if r < 0.8 else 'hard'
    elif position <= 80:
        difficulty = 'easy' if r < 0.3 else 'medium' if r < 0.8 else 'hard'
    else:
        difficulty = 'easy' if r < 0.2 else 'medium' if r < 0.6 else 'hard'

    global QUESTIONS_CACHE
    
    if QUESTIONS_CACHE is None:
        conn = get_connection()
        if not conn:
            raise HTTPException(status_code=500, detail="DB Error")
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT id, title, difficulty, platform, link, description FROM questions;")
            rows = cursor.fetchall()
            cursor.close()
            
            QUESTIONS_CACHE = { 'easy': [], 'medium': [], 'hard': [] }
            for row in rows:
                diff = row[2].lower()
                if diff in QUESTIONS_CACHE:
                    QUESTIONS_CACHE[diff].append({
                        "id": row[0], "title": row[1], "difficulty": row[2],
                        "platform": row[3], "link": row[4], "description": row[5]
                    })
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
        finally:
            if conn:
                release_connection(conn)
                
    cache_pool = QUESTIONS_CACHE.get(difficulty.lower(), [])
    if not cache_pool:
        # Fallback if that specific pool is empty
        all_questions = QUESTIONS_CACHE['easy'] + QUESTIONS_CACHE['medium'] + QUESTIONS_CACHE['hard']
        if not all_questions:
            raise HTTPException(status_code=404, detail="No questions found in memory cache")
        return random.choice(all_questions)
        
    return random.choice(cache_pool)
