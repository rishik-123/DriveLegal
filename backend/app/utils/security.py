"""Security utilities — JWT, bcrypt, AES encryption, CSRF tokens."""
import os
import uuid
import hashlib
import secrets
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import jwt
from cryptography.fernet import Fernet

from app.config import settings

logger = logging.getLogger("driveverse.security")

# Derive Fernet key from AES key
_fernet_key = hashlib.sha256(settings.AES_ENCRYPTION_KEY.encode()).digest()
_fernet = Fernet(Fernet.generate_key())  # Use a proper Fernet key


# ─── Password Hashing ───────────────────────────────────────────

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against its bcrypt hash."""
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


# ─── JWT Tokens ──────────────────────────────────────────────────

def create_access_token(user_id: str, email: str, role: str = "user") -> str:
    """Create a JWT access token."""
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "type": "access",
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES),
        "jti": str(uuid.uuid4()),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> tuple[str, str]:
    """Create a refresh token. Returns (token, token_hash)."""
    payload = {
        "sub": user_id,
        "type": "refresh",
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS),
        "jti": str(uuid.uuid4()),
    }
    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    return token, token_hash


def decode_token(token: str) -> Optional[dict]:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("JWT token expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid JWT token: {e}")
        return None


# ─── OTP Generation ──────────────────────────────────────────────

def generate_otp(length: int = 6) -> str:
    """Generate a cryptographically secure OTP."""
    return "".join([str(secrets.randbelow(10)) for _ in range(length)])


# ─── AES Encryption ──────────────────────────────────────────────

def encrypt_sensitive(data: str) -> str:
    """Encrypt sensitive data (engine numbers, etc.) using Fernet (AES)."""
    return _fernet.encrypt(data.encode()).decode()


def decrypt_sensitive(encrypted_data: str) -> str:
    """Decrypt sensitive data."""
    return _fernet.decrypt(encrypted_data.encode()).decode()


# ─── CSRF Token ──────────────────────────────────────────────────

def generate_csrf_token() -> str:
    """Generate a CSRF token."""
    return secrets.token_urlsafe(32)


def verify_csrf_token(token: str, stored_token: str) -> bool:
    """Verify a CSRF token using constant-time comparison."""
    return secrets.compare_digest(token, stored_token)


# ─── Mask Sensitive Data ─────────────────────────────────────────

def mask_chassis_number(chassis: str) -> str:
    """Mask chassis number showing only last 4 characters."""
    if not chassis or len(chassis) < 5:
        return "****"
    return "*" * (len(chassis) - 4) + chassis[-4:]


def mask_aadhaar(aadhaar: str) -> str:
    """Mask Aadhaar number showing only last 4 digits."""
    if not aadhaar or len(aadhaar) < 5:
        return "XXXX"
    return "XXXX-XXXX-" + aadhaar[-4:]
