from sqlalchemy.orm import Session
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from models import Source

sqlite_file_name = "database.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{sqlite_file_name}"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_sources(db: Session):
    default_sources = ["CharityBase", "Companies House"]
    for name in default_sources:
        existing = db.query(Source).filter_by(name=name).first()
        if not existing:
            db.add(Source(name=name))
    db.commit()
