# models.py
# This file defines all SQLAlchemy ORM models (database tables) and Pydantic models for the backend.
# Edit this file to add new tables, fields, or data validation schemas.

from typing import Annotated, List
from pydantic import BaseModel
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Text, LargeBinary
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from fastapi import UploadFile

Base = declarative_base()

# === USER TABLE ===
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    first_name = Column(String)
    last_name = Column(String)
    is_google_user = Column(Boolean, default=False)
    profile_picture = Column(LargeBinary, nullable=True)  # Store image as binary data
    profile_picture_type = Column(String, nullable=True)  # Store MIME type

    tokens = relationship("Token", back_populates="user")
    emails = relationship("Email", back_populates="user")

# === TOKEN TABLE ===
class Token(Base):
    __tablename__ = "tokens"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    expires_at = Column(DateTime)

    user = relationship("User", back_populates="tokens")

# === COMPANY TABLE ===
class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    status = Column(String, nullable=True)
    company_type = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    email = Column(String, nullable=True)
    postcode = Column(String, nullable=True)
    city = Column(String, nullable=True)
    region = Column(String, nullable=True)
    website = Column(String, nullable=True)
    activities = Column(Text, nullable=True)
    id_from_source = Column(Integer, nullable=True)
    source_id = Column(Integer, ForeignKey("sources.id"), nullable=True)

    emails = relationship("Email", back_populates="client")
    source = relationship("Source")

# === SOURCE TABLE ===
class Source(Base):
    __tablename__ = "sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

    companies = relationship("Company", back_populates="source")

# === EMAIL TABLE ===
class Email(Base):
    __tablename__ = "emails"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    client_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    ai = Column(Boolean, default=False)
    date = Column(DateTime, default=datetime.now(timezone.utc))
    subject = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    status = Column(String, nullable=True)  # e.g., "sent", "failed", "draft"

    user = relationship("User", back_populates="emails")
    client = relationship("Company", back_populates="emails")

# === ACTIVITY TABLE ===
class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    activity_type = Column(String, nullable=False)  # e.g., "client_added", "email_sent", "client_updated"
    description = Column(Text, nullable=False)
    company_name = Column(String, nullable=True)  # For client-related activities
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))

    user = relationship("User")
    company = relationship("Company")

# === Pydantic MODELS FOR REQUEST VALIDATION ===

class BulkEmailCreate(BaseModel):
    """
    Used for validating bulk email creation requests.
    """
    client_ids: List[int]
    subject: str
    content: str
    ai: bool
    status: str

class ProfilePictureUpdate(BaseModel):
    """
    Used for validating profile picture upload requests.
    """
    image: UploadFile
    max_size: int = 10 * 1024 * 1024  # 10MB limit
    allowed_types: set = {"image/jpeg", "image/png", "image/webp"}
