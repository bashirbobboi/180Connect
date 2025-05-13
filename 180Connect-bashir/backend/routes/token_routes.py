from fastapi import APIRouter, Depends, HTTPException, Form, Header, UploadFile, File
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

def verify_token(token_value: str, db: Session) -> Token:
    """Verify token and return Token object if valid"""
    token = db.query(Token).filter(Token.token == token_value).first()
    if not token:
        raise HTTPException(status_code=401, detail="Invalid token")

    current_time = datetime.now(timezone.utc)
    token_expiry = token.expires_at.replace(tzinfo=timezone.utc)

    if token_expiry < current_time:
        raise HTTPException(status_code=401, detail="Token expired")

    return token

def get_current_user_from_token(authorization: str, db: Session):
    token_value = authorization.replace("Bearer ", "")
    token = verify_token(token_value, db)
    return token.user

def delete_expired_tokens(db: Session):
    now = datetime.now(timezone.utc)
    db.query(Token).filter(Token.expires_at < now).delete()
    db.commit()

@router.get("/validate-token")
def valid_token(
    authorization: str = Header(...),
    db: Session = Depends(get_db)
):
    try:
        user = get_current_user_from_token(authorization, db)
        return {"detail": "Token is valid", "user": user.email}
    except HTTPException as e:
        raise e 
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/token")
def login_user(
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == email).first()
    if not user or user.password != password:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Generate token
    raw_token = secrets.token_hex(32)

    # Set expiry time (e.g., 1 hour)
    expiry_time = datetime.now(timezone.utc) + timedelta(hours=1)

    # Save to DB
    token = Token(token=raw_token, user_id=user.id, expires_at=expiry_time)
    db.add(token)
    db.commit()
    db.refresh(token)

    return {"access_token": token.token, "token_type": "bearer"}

@router.post("/logout")
def logout_user(
    authorization: str = Header(...),
    db: Session = Depends(get_db)
):
    try:
        token_value = authorization.replace("Bearer ", "")
        token = db.query(Token).filter(Token.token == token_value).first()
        
        if token:
            db.delete(token)
            db.commit()
            return {"detail": "Successfully logged out"}
        
        return {"detail": "Token not found"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Logout failed: {str(e)}")

@router.get("/user-profile")
def get_user_profile(
    authorization: str = Header(...),
    db: Session = Depends(get_db)
):
    try:
        token_value = authorization.replace("Bearer ", "")
        user = get_current_user_from_token(token_value, db)
        
        user_data = {
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "is_google_user": user.is_google_user
        }
        
        if user.profile_picture:
            user_data["profile_picture"] = {
                "data": base64.b64encode(user.profile_picture).decode(),
                "type": user.profile_picture_type
            }
            
        return {"user": user_data}
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
def update_user_profile(
    user_data: UserUpdate,
    authorization: str = Header(...),
    db: Session = Depends(get_db)
):
    try:
        current_user = get_current_user_from_token(authorization, db)
        
        # Check if email is being updated and if it's already taken
        if user_data.email and user_data.email != current_user.email:
            existing_user = db.query(User).filter(User.email == user_data.email).first()
            if existing_user:
                raise HTTPException(
                    status_code=400,
                    detail="Email already registered"
                )

        update_data = user_data.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(current_user, key, value)

        db.commit()
        db.refresh(current_user)

        return {
            "detail": "Profile updated successfully",
            "user": {
                "email": current_user.email,
                "first_name": current_user.first_name,
                "last_name": current_user.last_name
            }
        }

    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update profile: {str(e)}"
        )

@router.post("/upload-profile-picture")
async def upload_profile_picture(
    file: UploadFile = File(...),
    authorization: str = Header(...),
    db: Session = Depends(get_db)
):
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
        user = get_current_user_from_token(authorization, db)
        user.profile_picture = contents
        user.profile_picture_type = file.content_type
        
        db.commit()
        
        return {
            "detail": "Profile picture updated successfully",
            "type": file.content_type
        }
        
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload profile picture: {str(e)}"
        )

@router.delete("/delete-profile-picture")
async def delete_profile_picture(
    authorization: str = Header(...),
    db: Session = Depends(get_db)
):
    try:
        # Get current user
        user = get_current_user_from_token(authorization, db)
        
        # Check if user has a profile picture
        if not user.profile_picture:
            raise HTTPException(
                status_code=404,
                detail="No profile picture found"
            )
        
        # Remove profile picture
        user.profile_picture = None
        user.profile_picture_type = None
        
        db.commit()
        
        return {
            "message": "Profile picture deleted successfully"
        }
        
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete profile picture: {str(e)}"
        )