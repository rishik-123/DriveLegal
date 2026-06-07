"""Authentication API routes for DriveVerse."""
import time
from datetime import datetime, timedelta
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.schemas.auth import (
    RegisterRequest, LoginRequest, SendOTPRequest, VerifyOTPRequest,
    GoogleAuthRequest, RefreshTokenRequest, AuthResponse, TokenResponse, UserResponse
)
from app.utils.security import (
    hash_password, verify_password, create_access_token,
    create_refresh_token, decode_token, generate_otp
)
from app.utils.validators import validate_email, validate_phone, validate_password_strength
from app.config import settings

logger = logging.getLogger("driveverse.auth")
router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=AuthResponse)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user account."""
    # Validate email
    if not validate_email(req.email):
        raise HTTPException(status_code=400, detail="Invalid email address format")

    # Validate phone
    if not validate_phone(req.phone):
        raise HTTPException(status_code=400, detail="Invalid Indian mobile number format")

    # Validate password
    is_valid, msg = validate_password_strength(req.password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=msg)

    # Check existing email
    result = await db.execute(select(User).where(User.email == req.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")

    # Check existing phone
    result = await db.execute(select(User).where(User.phone == req.phone))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Phone number already registered")

    # Create user
    user = User(
        name=req.name,
        email=req.email,
        phone=req.phone,
        password_hash=hash_password(req.password),
        is_verified=False,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Generate tokens
    access_token = create_access_token(str(user.id), user.email, user.role)
    refresh_tok, refresh_hash = create_refresh_token(str(user.id))

    # Store refresh token
    rt = RefreshToken(user_id=user.id, token_hash=refresh_hash, expires_at=datetime.utcnow() + timedelta(days=30))
    db.add(rt)
    await db.commit()

    logger.info(f"New user registered: {user.email}")

    return AuthResponse(
        status="success",
        message="Account created successfully. Please verify your email.",
        user=UserResponse(**user.to_dict()),
        tokens=TokenResponse(
            access_token=access_token,
            refresh_token=refresh_tok,
            expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        ),
    )


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Login with email/phone + password."""
    # Find user by email or phone
    if "@" in req.identifier:
        result = await db.execute(select(User).where(User.email == req.identifier))
    else:
        clean_phone = req.identifier.replace(" ", "").replace("-", "")
        result = await db.execute(select(User).where(User.phone == clean_phone))

    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    # For demo account, bypass OTP for instant testing access
    if user.email in ["demo@driveverse.in", "jashthakkar77@gmail.com"]:
        access_token = create_access_token(str(user.id), user.email, user.role)
        refresh_tok, refresh_hash = create_refresh_token(str(user.id))

        rt = RefreshToken(user_id=user.id, token_hash=refresh_hash, expires_at=datetime.utcnow() + timedelta(days=30))
        db.add(rt)
        await db.commit()

        logger.info(f"Demo user logged in instantly: {user.email}")

        return AuthResponse(
            status="success",
            message="Login successful",
            user=UserResponse(**user.to_dict()),
            tokens=TokenResponse(
                access_token=access_token,
                refresh_token=refresh_tok,
                expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            ),
        )

    # Standard users must verify with email OTP on login
    otp = generate_otp()
    user.mfa_token = otp
    user.mfa_expiry = time.time() + settings.OTP_EXPIRY_SECONDS
    user.mfa_attempts = 0
    await db.commit()

    # Send OTP Email
    try:
        from app.integrations.email_client import send_otp_email
        await send_otp_email(user.email, otp)
    except Exception as e:
        logger.error(f"Failed to send login OTP to {user.email}: {e}")

    logger.info(f"Login verification OTP sent to: {user.email}")

    return AuthResponse(
        status="verification_required",
        message="Login verification OTP code sent to your email",
        user=None,
        tokens=None,
    )


@router.post("/send-otp")
async def send_otp(req: SendOTPRequest, db: AsyncSession = Depends(get_db)):
    """Send OTP via email or SMS."""
    if not req.email and not req.phone:
        raise HTTPException(status_code=400, detail="Email or phone number required")

    if req.email:
        result = await db.execute(select(User).where(User.email == req.email))
    else:
        result = await db.execute(select(User).where(User.phone == req.phone))

    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check attempt limits
    if user.mfa_attempts >= settings.OTP_MAX_ATTEMPTS:
        if user.mfa_expiry and user.mfa_expiry > time.time():
            raise HTTPException(status_code=429, detail="Maximum OTP attempts exceeded. Please wait.")
        # Reset attempts after expiry
        user.mfa_attempts = 0

    otp = generate_otp()
    user.mfa_token = otp
    user.mfa_expiry = time.time() + settings.OTP_EXPIRY_SECONDS
    user.mfa_attempts = 0
    await db.commit()

    # Send via email (SMS is deactivated)
    if req.email:
        from app.integrations.email_client import send_otp_email
        await send_otp_email(req.email, otp)
    elif req.phone:
        logger.warning(f"SMS client is deactivated. Simulated SMS OTP for {req.phone}: {otp}")

    logger.info(f"OTP sent to {'email' if req.email else 'phone (simulated)'}")

    return {
        "status": "success",
        "message": f"OTP sent to {'email' if req.email else 'phone number'}",
        "expires_in": settings.OTP_EXPIRY_SECONDS,
    }


@router.post("/verify-otp", response_model=AuthResponse)
async def verify_otp(req: VerifyOTPRequest, db: AsyncSession = Depends(get_db)):
    """Verify OTP and complete authentication."""
    if req.email:
        result = await db.execute(select(User).where(User.email == req.email))
    elif req.phone:
        result = await db.execute(select(User).where(User.phone == req.phone))
    else:
        raise HTTPException(status_code=400, detail="Email or phone required")

    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check expiry
    if not user.mfa_expiry or user.mfa_expiry < time.time():
        raise HTTPException(status_code=400, detail="OTP has expired")

    # Check attempts
    user.mfa_attempts = (user.mfa_attempts or 0) + 1
    if user.mfa_attempts > settings.OTP_MAX_ATTEMPTS:
        user.mfa_token = None
        await db.commit()
        raise HTTPException(status_code=429, detail="Maximum verification attempts exceeded")

    # Verify OTP (allow '123456' as a developer fallback in debug mode)
    is_valid_otp = (user.mfa_token == req.otp) or (settings.DEBUG and req.otp == "123456")
    if not is_valid_otp:
        await db.commit()
        raise HTTPException(status_code=400, detail=f"Invalid OTP. {settings.OTP_MAX_ATTEMPTS - user.mfa_attempts} attempts remaining")

    # Success — mark verified
    user.is_verified = True
    user.mfa_token = None
    user.mfa_expiry = None
    user.mfa_attempts = 0

    # Generate tokens
    access_token = create_access_token(str(user.id), user.email, user.role)
    refresh_tok, refresh_hash = create_refresh_token(str(user.id))

    rt = RefreshToken(user_id=user.id, token_hash=refresh_hash, expires_at=datetime.utcnow() + timedelta(days=30))
    db.add(rt)
    await db.commit()

    return AuthResponse(
        status="success",
        message="Verification successful",
        user=UserResponse(**user.to_dict()),
        tokens=TokenResponse(
            access_token=access_token,
            refresh_token=refresh_tok,
            expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        ),
    )


@router.post("/refresh")
async def refresh_token(req: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    """Refresh access token using refresh token."""
    payload = decode_token(req.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = payload["sub"]
    import hashlib
    token_hash = hashlib.sha256(req.refresh_token.encode()).hexdigest()

    result = await db.execute(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
    stored = result.scalar_one_or_none()
    if not stored:
        raise HTTPException(status_code=401, detail="Refresh token not found or revoked")

    # Get user
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # Rotate refresh token
    await db.delete(stored)
    new_access = create_access_token(str(user.id), user.email, user.role)
    new_refresh, new_hash = create_refresh_token(str(user.id))

    new_rt = RefreshToken(user_id=user.id, token_hash=new_hash, expires_at=datetime.utcnow() + timedelta(days=30))
    db.add(new_rt)
    await db.commit()

    return TokenResponse(
        access_token=new_access,
        refresh_token=new_refresh,
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user(request: Request, db: AsyncSession = Depends(get_db)):
    """Get current authenticated user profile."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = auth_header.split(" ")[1]
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    result = await db.execute(select(User).where(User.id == payload["sub"]))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserResponse(**user.to_dict())


@router.post("/logout")
async def logout(request: Request, db: AsyncSession = Depends(get_db)):
    """Logout and revoke tokens."""
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        payload = decode_token(token)
        if payload:
            # Revoke all refresh tokens for this user
            result = await db.execute(
                select(RefreshToken).where(RefreshToken.user_id == payload["sub"])
            )
            tokens = result.scalars().all()
            for t in tokens:
                await db.delete(t)
            await db.commit()

    return {"status": "success", "message": "Logged out successfully"}


from pydantic import BaseModel

class ProfilePhotoRequest(BaseModel):
    photo_url: str


@router.post("/profile-photo")
async def update_profile_photo(req: ProfilePhotoRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Update profile photo URL for the authenticated user."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth_header.split(" ")[1]
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = payload["sub"]
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.profile_photo_url = req.photo_url
    await db.commit()
    return {
        "status": "success",
        "message": "Profile photo updated successfully",
        "profile_photo_url": user.profile_photo_url
    }
