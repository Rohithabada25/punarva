import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import text
from dotenv import load_dotenv

# Load env variables
dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=dotenv_path, override=False)

from db import engine, Base, get_db
from routes.auth import router as auth_router
from routes.listings import router as listings_router
from routes.matches import router as matches_router
from routes.offers import router as offers_router
from routes.exchange import router as exchange_router
from routes.admin import router as admin_router
from routes.users_misc import router as users_misc_router
from auth import hash_password

# Ensure uploads directory exists
upload_dir = os.path.join(os.path.dirname(__file__), os.getenv("UPLOAD_DIR", "uploads"))
os.makedirs(upload_dir, exist_ok=True)

# Ensure tables exist and schema is up to date
Base.metadata.create_all(bind=engine)

def _init_db_schema():
    """Ensures new columns like password_hash exist on legacy MySQL tables."""
    try:
        from sqlalchemy import inspect
        insp = inspect(engine)
        if "users" in insp.get_table_names():
            cols = [c["name"] for c in insp.get_columns("users")]
            if "password_hash" not in cols:
                with engine.connect() as conn:
                    conn.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL"))
                    conn.commit()

            # Initialize seeded demo users with standard default hash if missing
            default_hash = hash_password("punarva123")
            with engine.connect() as conn:
                conn.execute(
                    text("UPDATE users SET password_hash = :pw WHERE password_hash IS NULL"),
                    {"pw": default_hash}
                )
                conn.commit()

        if "listings" in insp.get_table_names():
            listing_cols = [c["name"] for c in insp.get_columns("listings")]
            if "pickup_proposed_by" not in listing_cols:
                with engine.connect() as conn:
                    conn.execute(text("ALTER TABLE listings ADD COLUMN pickup_proposed_by VARCHAR(20) NULL"))
                    conn.commit()
    except Exception as e:
        print(f"Schema check note: {e}")

_init_db_schema()

app = FastAPI(
    title="Punarva API",
    description="Agentic AI Waste-to-Resource Platform - Give every material a second life",
    version="1.0.0"
)

# CORS configuration for Vite dev server and production frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads static folder
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")

# Include all API routers
app.include_router(auth_router)
app.include_router(listings_router)
app.include_router(matches_router)
app.include_router(offers_router)
app.include_router(exchange_router)
app.include_router(admin_router)
app.include_router(users_misc_router)

@app.get("/health", tags=["System"])
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint confirming FastAPI status and database connectivity."""
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "healthy",
        "app": "Punarva",
        "tagline": "Give every material a second life",
        "database": db_status
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=True)
