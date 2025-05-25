from fastapi import APIRouter, Depends, HTTPException, Request
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
async def google_auth(
    request: Request,
    token_request: GoogleTokenRequest,
):
    pool = request.app.state.db

    async with pool.acquire() as conn:
        try:
            # Verify the Google token
            idinfo = id_token.verify_oauth2_token(
                token_request.token,
                requests.Request(),
                GOOGLE_CLIENT_ID
            )

            email = idinfo["email"]
            picture_url = idinfo.get("picture")
            first_name = idinfo.get("given_name", "")
            last_name = idinfo.get("family_name", "")

            # Check if user exists
            user = await conn.fetchrow("SELECT * FROM users WHERE email = $1", email)

            if not user:
                profile_picture_bytes = None
                profile_picture_type = None

                # Download profile picture
                if picture_url:
                    try:
                        response = http_requests.get(picture_url)
                        if response.status_code == 200:
                            profile_picture_bytes = response.content
                            profile_picture_type = response.headers.get("content-type")
                    except Exception as e:
                        print(f"Failed to download profile picture: {e}")

                # Insert new Google user
                user = await conn.fetchrow(
                    """
                    INSERT INTO users (
                        email, password, first_name, last_name,
                        is_google_user, profile_picture, profile_picture_type
                    )
                    VALUES ($1, NULL, $2, $3, TRUE, $4, $5)
                    RETURNING id, email, first_name, last_name
                    """,
                    email,
                    first_name,
                    last_name,
                    profile_picture_bytes,
                    profile_picture_type
                )

            # Generate session token
            raw_token = secrets.token_hex(32)
            expiry_time = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(hours=1)

            await conn.execute(
                """
                INSERT INTO tokens (token, user_id, expires_at)
                VALUES ($1, $2, $3)
                """,
                raw_token,
                user["id"],
                expiry_time
            )

            return {
                "access_token": raw_token,
                "token_type": "bearer",
                "user": {
                    "email": user["email"],
                    "first_name": user["first_name"],
                    "last_name": user["last_name"]
                }
            }

        except ValueError:
            raise HTTPException(status_code=401, detail="Invalid Google token")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Auth failed: {str(e)}")