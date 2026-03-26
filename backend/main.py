from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import router
from database import is_db_available

app = FastAPI(
    title="Snakes & Ladders API",
    description="Backend API for the Snakes & Ladders game",
    version="1.0.0",
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
    return {
        "message": "🐍🪜 Snakes & Ladders API",
        "version": "1.0.0",
        "database": "connected" if is_db_available() else "not configured (using in-memory)",
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
