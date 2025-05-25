from fastapi import APIRouter, Depends, HTTPException, Form, Header, UploadFile, File, Request
from fastapi.security import OAuth2PasswordBearer
from models import User, Token
from database import get_db
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
import secrets
from typing import Optional
from pydantic import BaseModel
import base64

router = APIRouter(prefix="")

async def verify_token(token_value: str, conn):
    token = await conn.fetchrow(
        "SELECT * FROM tokens WHERE token = $1 LIMIT 1", token_value
    )

    current_time = datetime.now(timezone.utc)
    token_expiry = token["expires_at"].replace(tzinfo=timezone.utc)

    if token_expiry >= current_time:
        return token

async def get_render_user_from_uid(conn, id: int):
    if not conn:
        return None
    
    user = await conn.fetchrow("SELECT * FROM users WHERE id = $1 LIMIT 1", id)
    return user

@router.post("/token")
async def render_login_user(
    request: Request,
    email: str = Form(...),
    password: str = Form(...),
):
    pool = request.app.state.db

    async with pool.acquire() as conn:
        user = await conn.fetchrow(
            "SELECT * FROM users WHERE email = $1 LIMIT 1", email
        )
        if not user or user["password"] != password:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        raw_token = secrets.token_hex(32)
        expiry_time = (datetime.now(timezone.utc) + timedelta(hours=1)).replace(tzinfo=None)

        inserted_token = await conn.fetchrow(
            """
            INSERT INTO tokens (token, user_id, expires_at)
            VALUES ($1, $2, $3)
            RETURNING token;
            """,
            raw_token,
            user["id"],
            expiry_time,
        )

    return {"access_token": inserted_token["token"], "token_type": "bearer"}

@router.post("/logout")
async def logout_user(
    request: Request,
    authorization: str = Header(...)
):
    pool = request.app.state.db

    async with pool.acquire() as conn:
        try:
            token_value = authorization.replace("Bearer ", "")
            token = await conn.fetchrow("SELECT * FROM tokens WHERE token = $1 LIMIT 1", token_value)

            if token:
                await conn.execute("DELETE FROM tokens WHERE token = $1", token_value)
                return {"detail": "Successfully logged out"}

            return {"detail": "Token not found"}

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Logout failed: {str(e)}")
    

@router.get("/user-profile")
async def render_get_user_profile(
    request: Request,
    authorization: str = Header(...)
):  
    pool = request.app.state.db
    async with pool.acquire() as conn:
        try:
            token_value = authorization.replace("Bearer ", "")
            token = await verify_token(token_value, conn)
            
            user = await get_render_user_from_uid(conn, token["user_id"])
            
            user_data = {
                "email": user["email"],
                "first_name": user["first_name"],
                "last_name": user["last_name"],
                "is_google_user": user["is_google_user"]
            }
            
            if user["profile_picture"]:
                user_data["profile_picture"] = {
                    "data": base64.b64encode(user["profile_picture"]).decode(),
                    "type": user["profile_picture_type"]
                }
                
            return {"user": user_data}
        except HTTPException as e:
            raise e 
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/validate-token")
async def render_valid_token(
    request: Request,
    authorization: str = Header(...),
):
    pool = request.app.state.db

    async with pool.acquire() as conn:
        token_value = authorization.replace("Bearer ", "")
        token = await verify_token(token_value, conn)

        if not token:
            raise HTTPException(status_code=401, detail="Invalid token")

        current_time = datetime.now(timezone.utc)
        token_expiry = token["expires_at"].replace(tzinfo=timezone.utc)

        if token_expiry < current_time:
            raise HTTPException(status_code=401, detail="Token expired")

        try:
            user = await get_render_user_from_uid(conn, token["user_id"])
            return {"detail": "Token is valid", "user": user["email"]}
        except HTTPException as e:
            raise e 
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None

@router.put("/update-profile")
async def update_user_profile(
    request: Request,
    user_data: UserUpdate,
    authorization: str = Header(...)
):
    pool = request.app.state.db

    async with pool.acquire() as conn:
        try: 
            token_value = authorization.replace("Bearer ", "")
            token = await verify_token(token_value, conn)
            user_id = token["user_id"]

            current_user = await get_render_user_from_uid(conn, user_id)

            if not current_user:
                raise HTTPException(status_code=404, detail="User not found")

            # Check if email is being updated and already exists
            if user_data.email and user_data.email != current_user["email"]:
                existing_user = await conn.fetchrow("SELECT * FROM users WHERE email = $1 LIMIT 1", user_data.email)
                if existing_user:
                    raise HTTPException(status_code=400, detail="Email already registered")

            update_fields = []
            update_values = []

            field_map = {
                "first_name": user_data.first_name,
                "last_name": user_data.last_name,
                "email": user_data.email,
                "password": user_data.password,
            }

            for idx, (field, value) in enumerate(field_map.items(), start=1):
                if value is not None:
                    update_fields.append(f"{field} = ${len(update_values)+1}")
                    update_values.append(value)

            if update_fields:
                query = f"""
                    UPDATE users SET {', '.join(update_fields)}
                    WHERE id = ${len(update_values)+1}
                """
                update_values.append(user_id)
                await conn.execute(query, *update_values)

            updated_user = await get_render_user_from_uid(conn, user_id)

            return {
                "detail": "Profile updated successfully",
                "user": {
                    "email": updated_user["email"],
                    "first_name": updated_user["first_name"],
                    "last_name": updated_user["last_name"]
                }
            }

        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to update profile: {str(e)}"
            )

@router.post("/upload-profile-picture")
async def upload_profile_picture(
    request: Request,
    file: UploadFile = File(...),
    authorization: str = Header(...),
):
    pool = request.app.state.db

    async with pool.acquire() as conn:
        try:
            # Validate file type
            if not file.content_type.startswith('image/'):
                raise HTTPException(
                    status_code=400, 
                    detail="File must be an image (JPEG, PNG, or WebP)"
                )
            
            # Check file size (10MB limit)
            MAX_SIZE = 10 * 1024 * 1024
            contents = await file.read()
            if len(contents) > MAX_SIZE:
                raise HTTPException(
                    status_code=400, 
                    detail="File size too large (max 10MB)"
                )
            
            # Get current user and update profile picture
            token_value = authorization.replace("Bearer ", "")
            token = await verify_token(token_value, conn)
            
            await conn.execute(
                """
                UPDATE users
                SET profile_picture = $1,
                    profile_picture_type = $2
                WHERE id = $3
                """,
                contents,
                file.content_type,
                token["user_id"]
            )
            
            return {
                "detail": "Profile picture updated successfully",
                "type": file.content_type
            }
            
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to upload profile picture: {str(e)}"
            )

@router.delete("/delete-profile-picture")
async def delete_profile_picture(
    request: Request,
    authorization: str = Header(...),
):
    pool = request.app.state.db
    async with pool.acquire() as conn:
        try:
            # Get current user
            token_value = authorization.replace("Bearer ", "")
            token = await verify_token(token_value, conn)        
            user = await get_render_user_from_uid(conn, token["user_id"])
            
            # Check if user has a profile picture
            if not user["profile_picture"]:
                raise HTTPException(
                    status_code=404,
                    detail="No profile picture found"
                )
            
            # Remove profile picture
            user["profile_picture"] = None
            user["profile_picture_type"] = None
                        
            return {
                "message": "Profile picture deleted successfully"
            }
        
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to delete profile picture: {str(e)}"
            )