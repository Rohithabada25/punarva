import os
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

try:
    from ..db import get_db
    from ..models import User
    from ..schemas import UserRegister, UserLogin, UserResponse, AuthResponse, PersonaSwitchRequest
    from ..auth import hash_password, verify_password, create_access_token, get_current_user
except ImportError:
    from db import get_db
    from models import User
    from schemas import UserRegister, UserLogin, UserResponse, AuthResponse, PersonaSwitchRequest
    from auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserRegister, db: Session = Depends(get_db)):
    """
    Registers a new user with secure password hashing.
    Validates email uniqueness and minimum password length (6+ chars).
    """
    clean_email = payload.email.strip().lower()
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    hashed_pw = hash_password(payload.password)
    user = User(
        name=payload.name.strip(),
        email=clean_email,
        password_hash=hashed_pw,
        role=payload.role,
        city=payload.city.strip() if payload.city else "Bapatla",
        lat=payload.lat if payload.lat is not None else 15.9042,
        lng=payload.lng if payload.lng is not None else 80.4674,
        preferred_language=payload.preferred_language
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({
        "sub": user.id,
        "email": user.email,
        "role": user.role,
        "name": user.name
    })

    return AuthResponse(user=UserResponse.model_validate(user), token=token)


@router.post("/login", response_model=AuthResponse)
def login_user(payload: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticates a user via email and password.
    Returns the user profile and a signed access token.
    """
    clean_email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    token = create_access_token({
        "sub": user.id,
        "email": user.email,
        "role": user.role,
        "name": user.name
    })

    return AuthResponse(user=UserResponse.model_validate(user), token=token)


@router.post("/switch-persona", response_model=AuthResponse)
def switch_persona(payload: PersonaSwitchRequest, db: Session = Depends(get_db)):
    """
    Quickly switches active persona during demo evaluation and issues a fresh session token.
    """
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requested persona not found."
        )

    token = create_access_token({
        "sub": user.id,
        "email": user.email,
        "role": user.role,
        "name": user.name
    })

    return AuthResponse(user=UserResponse.model_validate(user), token=token)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Returns profile for currently authenticated user."""
    return current_user
