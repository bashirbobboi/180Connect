from fastapi import APIRouter, Depends, HTTPException
from models import User, Token
from database import get_db
from datetime import datetime, timedelta, timezone
import requests as http_requests
from sqlalchemy.orm import Session
import secrets
from google_authentication import GoogleTokenRequest, GOOGLE_CLIENT_ID
from google.oauth2 import id_token
from google.auth.transport import requests

router = APIRouter(prefix="")

@router.post("/auth/google")
def google_auth(
    token_request: GoogleTokenRequest,
    db: Session = Depends(get_db)
):
    try:
        # Verify the Google token
        idinfo = id_token.verify_oauth2_token(
            token_request.token, 
            requests.Request(), 
            GOOGLE_CLIENT_ID
        )

        email = idinfo['email']
        picture_url = idinfo.get('picture')
        
        # Check if user exists
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                email=email,
                first_name=idinfo.get('given_name', ''),
                last_name=idinfo.get('family_name', ''),
                password=None,  # No password for Google users
                is_google_user=True
            )

            # Download and save profile picture if available
            if picture_url:
                try:
                    response = http_requests.get(picture_url)
                    if response.status_code == 200:
                        user.profile_picture = response.content
                        user.profile_picture_type = response.headers.get('content-type')
                except Exception as e:
                    print(f"Failed to download profile picture: {e}")
            
            db.add(user)
            db.commit()
            db.refresh(user)

        # Generate token
        raw_token = secrets.token_hex(32)
        expiry_time = datetime.now(timezone.utc) + timedelta(hours=1)
        
        # Save token
        token = Token(token=raw_token, user_id=user.id, expires_at=expiry_time)
        db.add(token)
        db.commit()
        
        return {
            "access_token": raw_token,
            "token_type": "bearer",
            "user": {
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name
            }
        }
        
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google token")
    