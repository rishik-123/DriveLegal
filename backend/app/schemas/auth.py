"""Auth request/response schemas."""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=15)
    password: str = Field(..., min_length=8)


class LoginRequest(BaseModel):
    identifier: str = Field(..., description="Email or phone number")
    password: str


class SendOTPRequest(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None


class VerifyOTPRequest(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    otp: str = Field(..., min_length=6, max_length=6)


class GoogleAuthRequest(BaseModel):
    credential: str  # Google ID token


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    profile_photo_url: Optional[str] = None
    is_verified: bool
    role: str
    driving_score: int
    created_at: Optional[str] = None


class AuthResponse(BaseModel):
    status: str
    message: str
    user: Optional[UserResponse] = None
    tokens: Optional[TokenResponse] = None
