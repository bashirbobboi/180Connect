# from google.oauth2 import id_token
# from google.auth.transport import requests
from pydantic import BaseModel
# from sqlalchemy.orm import Session
# from fastapi import Depends, HTTPException
# from main import app, get_user, get_db
# from users import User, Token
# import secrets
# from datetime import datetime, timedelta, timezone

GOOGLE_CLIENT_ID = "197447102347-ustgcqknmtt21akdst1fh8vqvpef7ia1.apps.googleusercontent.com"

class GoogleTokenRequest(BaseModel):
    token: str

# @app.post("/auth/google")
# def google_auth(
#     token_request: GoogleTokenRequest,
#     db: Session = Depends(get_db)
# ):
#     try:
#         # Verify the Google token
#         idinfo = id_token.verify_oauth2_token(
#             token_request.token, 
#             requests.Request(), 
#             GOOGLE_CLIENT_ID
#         )

#         email = idinfo['email']
        
#         # Check if user exists
#         user = get_user(db, email)
#         if not user:
#             # Create new user
#             user = User(
#                 email=email,
#                 first_name=idinfo.get('given_name', ''),
#                 last_name=idinfo.get('family_name', ''),
#                 password=None,  # No password for Google users
#                 is_google_user=True
#             )
#             db.add(user)
#             db.commit()
#             db.refresh(user)

#         # Generate token
#         raw_token = secrets.token_hex(32)
#         expiry_time = datetime.now(timezone.utc) + timedelta(hours=1)
        
#         # Save token
#         token = Token(token=raw_token, user_id=user.id, expires_at=expiry_time)
#         db.add(token)
#         db.commit()
        
#         return {
#             "access_token": raw_token,
#             "token_type": "bearer",
#             "user": {
#                 "email": user.email,
#                 "first_name": user.first_name,
#                 "last_name": user.last_name
#             }
#         }
        
#     except ValueError:
#         raise HTTPException(status_code=401, detail="Invalid Google token")
    
