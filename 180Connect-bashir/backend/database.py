# database.py
# This file sets up the database connection and session management for the backend.
# Edit this file to change the database type, location, or to add new initialization logic.

from sqlalchemy.orm import Session
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from models import Source
from data_collection import fetch_charity_data, fetch_companies_data, get_locations_from_postcodes

async def create_db_tables(db_pool):
    if not db_pool:
        return
    async with db_pool.acquire() as conn:
        # === USER TABLE ===
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR UNIQUE NOT NULL,
                password VARCHAR,
                first_name VARCHAR,
                last_name VARCHAR,
                is_google_user BOOLEAN DEFAULT FALSE,
                profile_picture BYTEA,
                profile_picture_type VARCHAR
            );
            """
        )

        # === TOKEN TABLE ===
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS tokens (
                id SERIAL PRIMARY KEY,
                token VARCHAR UNIQUE,
                user_id INTEGER REFERENCES users(id),
                expires_at TIMESTAMP
            );
            """
        )

        # === SOURCE TABLE ===
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS sources (
                id SERIAL PRIMARY KEY,
                name VARCHAR UNIQUE NOT NULL
            );
            """
        )

        # === COMPANY TABLE ===
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS companies (
                id SERIAL PRIMARY KEY,
                name VARCHAR NOT NULL,
                status VARCHAR,
                company_type VARCHAR,
                address TEXT,
                email VARCHAR,
                postcode VARCHAR,
                city VARCHAR,
                region VARCHAR,
                website VARCHAR,
                activities TEXT,
                id_from_source INTEGER,
                source_id INTEGER REFERENCES sources(id)
            );
            """
        )

        # === EMAIL TABLE ===
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS emails (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                client_id INTEGER NOT NULL REFERENCES companies(id),
                ai BOOLEAN DEFAULT FALSE,
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                subject VARCHAR NOT NULL,
                content TEXT NOT NULL,
                status VARCHAR,
                CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id),
                CONSTRAINT fk_client FOREIGN KEY(client_id) REFERENCES companies(id)
            );
            """
        )

    print("Database tables successfully created")

# Run this function to populate the database with client data
async def get_client_data_for_database(db_pool):
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

    async with db_pool.acquire() as conn:
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
