from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import api_routes, token_routes, google_routes, client_routes
from database import engine
from models import Base
from data_collection import get_client_data_for_database
import os

app = FastAPI()

# Add a root route
@app.get("/")
async def root():
    return {
        "message": "180Connect API is running",
        "docs": "/docs",
        "status": "healthy"
    }

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # React dev server
        "https://one80connect.vercel.app",  # Your Vercel frontend URL
        "https://180-connect.vercel.app",    # Alternative Vercel URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(api_routes.router)
app.include_router(token_routes.router)
app.include_router(google_routes.router)
app.include_router(client_routes.router)

def init_db():
    Base.metadata.create_all(bind=engine)
    get_client_data_for_database()

# To create the tables in the database (only necessary when running server for the first time)
# init_db()

# ---------------------------
# 🔹 Run the FastAPI Server
# ---------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
