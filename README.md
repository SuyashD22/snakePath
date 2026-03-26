# Snakes & Ladders — Full Stack Game

## Frontend (Next.js)
Node.js project in `myapp/frontend/`

## Backend (FastAPI)
Python project in `myapp/backend/`

## Setup

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Environment Variables
Copy `backend/.env.example` to `backend/.env` and fill in your Supabase credentials.
