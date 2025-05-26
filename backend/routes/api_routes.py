from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, Request
from fastapi.security import OAuth2PasswordBearer
from models import User
from typing import Annotated
from jose import JWTError, jwt
from sqlalchemy.orm import Session

router = APIRouter(prefix="")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

SECRET_KEY = "your_very_secret_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120 # Access tokens expire after 2 hours

@router.post("/register")
async def register_user(
    request: Request,
    email: str = Form(...),
    password: str = Form(...),
    first_name: str = Form(...),
    last_name: str = Form(...),
):
    pool = request.app.state.db

    async with pool.acquire() as conn:
        user = await pool.fetchrow("SELECT * FROM users WHERE email = $1 LIMIT 1", email)
        if user:
            raise HTTPException(status_code=400, detail="User already exists")
        
        # Uses parameterised queries ($1, $2, etc.) to prevent SQL injection.
        query = """
            INSERT INTO users (email, password, first_name, last_name, is_google_user, profile_picture, profile_picture_type)
            VALUES ($1, $2, $3, $4, FALSE, NULL, NULL)
            RETURNING *;
        """
        new_user = await pool.fetchrow(query, email, password, first_name, last_name)
        if not new_user:
            raise HTTPException(status_code=400, detail="An error occurred")
        
        return {"message": "User created"}
    