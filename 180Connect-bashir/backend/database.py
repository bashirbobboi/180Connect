# database.py
# This file sets up the database connection and session management for the backend.
# Edit this file to change the database type, location, or to add new initialization logic.

from sqlalchemy.orm import Session
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from models import Source

# === DATABASE CONFIGURATION ===
# Change 'sqlite_file_name' to use a different database file or path.
sqlite_file_name = "database.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{sqlite_file_name}"

# === SQLAlchemy ENGINE & SESSION ===
# 'connect_args' is needed for SQLite to allow usage in multi-threaded apps.
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """
    Dependency for FastAPI routes.
    Yields a database session and ensures it is closed after use.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_sources(db: Session):
    """
    Initialize the 'Source' table with default sources if they do not exist.
    Call this after creating tables to ensure required sources are present.
    """
    default_sources = ["CharityBase", "Companies House"]
    for name in default_sources:
        existing = db.query(Source).filter_by(name=name).first()
        if not existing:
            db.add(Source(name=name))
    db.commit()