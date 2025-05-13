from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile
from fastapi.security import OAuth2PasswordBearer
from models import User
from database import get_db
from typing import Annotated
from jose import JWTError, jwt
from sqlalchemy.orm import Session

router = APIRouter(prefix="")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

SECRET_KEY = "your_very_secret_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120 # Access tokens expire after 2 hours

def get_user(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def authenticate_user(db: Session, email: str, password: str):
    user = get_user(db, email)
    if not user or user.password != password:
        return None
    return user

async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Session = Depends(get_db)
):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = get_user(db, email)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/register")
def register_user(
    email: str = Form(...),
    password: str = Form(...),
    first_name: str = Form(...),
    last_name: str = Form(...),
    db: Session = Depends(get_db)
):
    user = get_user(db, email)
    if user:
        raise HTTPException(status_code=400, detail="User already exists")
    new_user = User(email=email, password=password, first_name=first_name, last_name=last_name)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created"}
