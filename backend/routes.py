from fastapi import APIRouter, HTTPException
from database import get_connection, release_connection
from models import (
    GameSetup, GameState, TeamConfig, PendingApproval, 
    RollSubmit, VerdictRequest
)

router = APIRouter(prefix="/api")

@router.get("/state", response_model=GameState)
async def get_state():
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
async def setup_game(setup: GameSetup):
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
async def reset_game():
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
async def log_roll(roll: RollSubmit):
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
async def roll_verdict(verdict: VerdictRequest):
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
