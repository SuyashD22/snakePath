from dotenv import load_dotenv
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import router
from database import get_connection, release_connection, init_pool

# Load environment variables from .env
load_dotenv()

import json
from contextlib import asynccontextmanager

def init_db():
    conn = get_connection()
    if not conn:
        print("Could not connect to DB for initialization.")
        return
        
    try:
        cursor = conn.cursor()
        
        # Table 1: game_config
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS game_config (
            id SERIAL PRIMARY KEY,
            num_teams INTEGER NOT NULL DEFAULT 3,
            game_started BOOLEAN NOT NULL DEFAULT FALSE
        );
        """)
        
        # Ensure at least one row exists
        cursor.execute("SELECT COUNT(*) FROM game_config;")
        if cursor.fetchone()[0] == 0:
            cursor.execute("INSERT INTO game_config (id, num_teams, game_started) VALUES (1, 3, FALSE);")
            
        # Table 2: teams
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS teams (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            password VARCHAR(255) NOT NULL,
            color VARCHAR(50) NOT NULL,
            avatar VARCHAR(50) NOT NULL,
            position INTEGER NOT NULL DEFAULT 0,
            dice_unlocked BOOLEAN NOT NULL DEFAULT TRUE,
            waiting_for_approval BOOLEAN NOT NULL DEFAULT FALSE
        );
        """)
        
        # Table 3: pending_approvals
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS pending_approvals (
            id SERIAL PRIMARY KEY,
            team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
            team_name VARCHAR(100) NOT NULL,
            team_color VARCHAR(50) NOT NULL,
            roll INTEGER NOT NULL,
            from_position INTEGER NOT NULL,
            question_id VARCHAR(100),
            question_title VARCHAR(255),
            question_difficulty VARCHAR(50),
            question_link TEXT,
            timestamp BIGINT NOT NULL
        );
        """)
        
        # Table 4: questions
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS questions (
            id VARCHAR(100) PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            difficulty VARCHAR(50) NOT NULL,
            platform VARCHAR(50) NOT NULL,
            link TEXT,
            description TEXT
        );
        """)

        # Ensure questions are seeded
        cursor.execute("SELECT COUNT(*) FROM questions;")
        if cursor.fetchone()[0] == 0:
            if os.path.exists("questions.json"):
                with open("questions.json", "r", encoding="utf-8") as f:
                    qs = json.load(f)
                    for q in qs:
                        cursor.execute(
                            "INSERT INTO questions (id, title, difficulty, platform, link, description) VALUES (%s, %s, %s, %s, %s, %s);",
                            (q["id"], q["title"], q["difficulty"], q["platform"], q["link"], q.get("description", ""))
                        )
                print(f"Seeded {len(qs)} questions into database.")

        conn.commit()
        cursor.close()
        print("Database schema initialized successfully.")
    except Exception as e:
        print(f"Error initializing DB schema: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            release_connection(conn)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup event: Initialize Database
    init_pool()
    init_db()
    yield
    # Shutdown event
    pass

app = FastAPI(
    title="Snakes & Ladders API",
    description="Backend API for the Snakes & Ladders game",
    version="1.0.0",
    lifespan=lifespan
)


# CORS - allow frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
async def root():
    conn = get_connection()
    status = "connected" if conn else "failed to connect (check .env and password)"
    if conn:
        release_connection(conn)
    return {
        "message": "🐍\U0001f4a8 Snakes & Ladders API",
        "version": "1.0.0",
        "database": status
    }


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/db-test")
async def db_test():
    conn = None
    try:
        conn = get_connection()
        if not conn:
            return {"status": "error", "detail": "Could not establish database connection. Check if DATABASE_URL is correct and password characters are escaped if needed."}
        
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        cursor.close()
        return {"status": "connected", "postgresql_version": version[0]}
    except Exception as e:
        return {"status": "error", "detail": str(e)}
    finally:
        if conn:
            release_connection(conn)
