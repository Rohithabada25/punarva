import os
import json
import base64
import hmac
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

try:
    from .db import get_db
    from .models import User
except ImportError:
    from db import get_db
    from models import User

# Secret key for signing tokens
SECRET_KEY = os.getenv("SECRET_KEY", "punarva-circular-secret-key-2025-secure-token")
ALGORITHM = "HS256"
DEFAULT_DEMO_PASSWORD = "punarva123"

bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    """
    Hashes a password using PBKDF2-HMAC-SHA256 with 100,000 iterations
    and a random 16-byte hex salt. Returns 'salt$digest'.
    """
    if not password:
        raise ValueError("Password cannot be empty")
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100000
    )
    return f"{salt}${key.hex()}"


def verify_password(plain_password: str, hashed_password: Optional[str]) -> bool:
    """
    Verifies a plain password against the stored salt$digest.
    Supports backward compatibility for seeded demo accounts initialized before passwords.
    """
    if not plain_password:
        return False

    # Seeded accounts without hash or with default demo password
    if not hashed_password:
        return plain_password == DEFAULT_DEMO_PASSWORD

    if "$" not in hashed_password:
        # Fallback check
        return plain_password == DEFAULT_DEMO_PASSWORD or plain_password == hashed_password

    try:
        salt, expected_digest = hashed_password.split("$", 1)
        test_key = hashlib.pbkdf2_hmac(
            "sha256",
            plain_password.encode("utf-8"),
            salt.encode("utf-8"),
            100000
        )
        return hmac.compare_digest(test_key.hex(), expected_digest)
    except Exception:
        return False


def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _base64url_decode(data: str) -> bytes:
    padding = "=" * (4 - len(data) % 4)
    return base64.urlsafe_b64decode((data + padding).encode("utf-8"))


def create_access_token(data: Dict[str, Any], expires_minutes: int = 1440) -> str:
    """
    Creates a signed HMAC-SHA256 JWT-compatible bearer token.
    Default expiry is 24 hours (1440 minutes).
    """
    header = {"alg": "HS256", "typ": "JWT"}
    payload = data.copy()
    exp = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    payload["exp"] = int(exp.timestamp())
    payload["iat"] = int(datetime.now(timezone.utc).timestamp())

    header_bytes = json.dumps(header, separators=(",", ":")).encode("utf-8")
    payload_bytes = json.dumps(payload, separators=(",", ":")).encode("utf-8")

    encoded_header = _base64url_encode(header_bytes)
    encoded_payload = _base64url_encode(payload_bytes)

    signing_input = f"{encoded_header}.{encoded_payload}".encode("utf-8")
    signature = hmac.new(SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()
    encoded_signature = _base64url_encode(signature)

    return f"{encoded_header}.{encoded_payload}.{encoded_signature}"


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decodes and verifies a signed token. Returns payload dict or None if invalid or expired.
    """
    try:
        parts = token.strip().split(".")
        if len(parts) != 3:
            return None

        encoded_header, encoded_payload, encoded_signature = parts
        signing_input = f"{encoded_header}.{encoded_payload}".encode("utf-8")
        expected_sig = hmac.new(SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()

        if not hmac.compare_digest(_base64url_encode(expected_sig), encoded_signature):
            return None

        payload_bytes = _base64url_decode(encoded_payload)
        payload = json.loads(payload_bytes.decode("utf-8"))

        # Verify expiration
        exp = payload.get("exp")
        if exp and exp < int(datetime.now(timezone.utc).timestamp()):
            return None

        return payload
    except Exception:
        return None


def get_current_user_optional(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Retrieves current authenticated user if valid token provided; returns None otherwise."""
    if not auth or not auth.credentials:
        return None

    payload = decode_access_token(auth.credentials)
    if not payload:
        return None

    user_id = payload.get("sub")
    if not user_id:
        return None

    return db.query(User).filter(User.id == int(user_id)).first()


def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Strict dependency requiring authenticated user."""
    user = get_current_user_optional(auth, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
