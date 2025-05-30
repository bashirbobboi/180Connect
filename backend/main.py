# main.py
# This is the main entry point for the FastAPI backend application.
# It sets up the FastAPI app, configures CORS, and includes all API routers.

from fastapi import FastAPI, Form, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from routes import token_routes, google_routes, client_routes, api_routes
from database import get_client_data_for_database, create_db_tables
from models import Base
import os
import asyncpg
from dotenv import load_dotenv
from datetime import datetime, timezone, timedelta
import secrets
import base64

load_dotenv() # Loading environment variables from .env
app = FastAPI()

@app.on_event("startup")
async def startup():
    app.state.db = await asyncpg.create_pool(os.getenv("RENDER_DATABASE_URL"))
    # await get_client_data_for_database()

@app.on_event("shutdown")
async def shutdown():
    await app.state.db.close()

# === ROOT ROUTE ===
@app.get("/")
async def root():
    """
    Health check endpoint.
    Returns a simple status message and link to API docs.
    """
    return {
        "message": "180Connect API is running",
        "docs": "/docs",
        "status": "healthy"
    }

# === CORS CONFIGURATION ===
# Add frontend URLs here to allow cross-origin requests from your deployed frontend(s).
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # React dev server
        "https://one80connect.vercel.app",  # Your Vercel frontend URL
        "https://180-connect.vercel.app",   # Alternative Vercel URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === INCLUDE API ROUTERS ===
# These import and register all API endpoints for the app.
app.include_router(api_routes.router)
app.include_router(token_routes.router)
app.include_router(google_routes.router)
app.include_router(client_routes.router)

# To initialise the SQLite database
async def init_db():
    """
    Initialize the database and (optionally) populate it with client data.
    Call this function if you need to create tables and import data on first run.
    """
    # Base.metadata.create_all(bind=engine)
    await create_db_tables(app.state.db)
    await get_client_data_for_database(app.state.db)

# To create the tables in the database
# init_db()

# === RUN THE FASTAPI SERVER ===
# This block allows you to run the app directly with `python main.py`
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
