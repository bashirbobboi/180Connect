# main.py
# This is the main entry point for the FastAPI backend application.
# It sets up the FastAPI app, configures CORS, and includes all API routers.

from fastapi import FastAPI, Form, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from routes import token_routes, google_routes, client_routes, api_routes
from database import engine
from models import Base
from data_collection import fetch_charity_data, fetch_companies_data, get_locations_from_postcodes
import os
import asyncpg
from dotenv import load_dotenv
from datetime import datetime, timezone, timedelta
import secrets
import base64

load_dotenv() # Loading environment variables from .env
app = FastAPI()

async def get_client_data_for_database():
    """
    Async version: Fetch data from multiple sources, clean it, and save to the database using asyncpg.
    Assumes app.state.db is an asyncpg pool and tables `companies` and `sources` exist.
    """
    charities = fetch_charity_data() or []
    companies = fetch_companies_data() or []

    # Collect all postcodes
    charity_postcodes = [c["contact"]["postcode"] if c.get("contact") else "N/A" for c in charities]
    company_postcodes = [c.get("postcode", "N/A") for c in companies]
    location_data = get_locations_from_postcodes(charity_postcodes + company_postcodes)

    async with app.state.db.acquire() as conn:
        # Ensure source exists and get ID
        async def get_or_create_source_id(source_name):
            source_row = await conn.fetchrow("SELECT id FROM sources WHERE name = $1", source_name)
            if source_row:
                return source_row["id"]
            insert_row = await conn.fetchrow("INSERT INTO sources (name) VALUES ($1) RETURNING id", source_name)
            return insert_row["id"]

        charity_source_id = await get_or_create_source_id("CharityBase")
        for c in charities:
            postcode = c["contact"]["postcode"] if c.get("contact") else "N/A"
            location = location_data.get(postcode, {"city": "N/A", "region": "N/A"})
            await conn.execute(
                """
                INSERT INTO companies (id_from_source, name, status, company_type, address, email, postcode, website, activities, source_id, city, region)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                """,
                c["id"],
                c["names"][0]["value"] if "names" in c and c["names"] else "N/A",
                "active",
                "Charity",
                ", ".join(c["contact"].get("address", [])) if c.get("contact") and isinstance(c["contact"].get("address"), list) else "N/A",
                c["contact"]["email"] if c.get("contact") else "N/A",
                postcode,
                c.get("website", "N/A"),
                c.get("activities", "N/A"),
                charity_source_id,
                location["city"],
                location["region"]
            )

        ch_source_id = await get_or_create_source_id("Companies House")
        for c in companies:
            postcode = c.get("postcode", "N/A")
            location = location_data.get(postcode, {"city": "N/A", "region": "N/A"})
            await conn.execute(
                """
                INSERT INTO companies (id_from_source, name, status, company_type, address, postcode, website, source_id, city, region)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                """,
                c.get("id"),
                c.get("name", "N/A"),
                c.get("status", "N/A"),
                c.get("company_type", "N/A"),
                c.get("address", "N/A"),
                postcode,
                c.get("website", "N/A"),
                ch_source_id,
                location["city"],
                location["region"]
            )

    print(f"✅ Data saved to database (Total entries: {len(charities) + len(companies)})")


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

def init_db():
    """
    Initialize the database and (optionally) populate it with client data.
    Call this function if you need to create tables and import data on first run.
    """
    # Base.metadata.create_all(bind=engine)
    get_client_data_for_database()

# To create the tables in the database (only necessary when running server for the first time)
# init_db()

# === RUN THE FASTAPI SERVER ===
# This block allows you to run the app directly with `python main.py`
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
