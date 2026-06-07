"""User model for DriveVerse authentication and profile management."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, Integer, Float, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(20), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    profile_photo_url = Column(Text, nullable=True)

    # Verification & Status
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    role = Column(String(20), default="user")  # user, admin, family_member

    # Driving Score
    driving_score = Column(Integer, default=100)

    # MFA
    mfa_token = Column(String(10), nullable=True)
    mfa_expiry = Column(Float, nullable=True)
    mfa_attempts = Column(Integer, default=0)

    # Google OAuth
    google_id = Column(String(255), nullable=True, unique=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    vehicles = relationship("Vehicle", back_populates="user", lazy="selectin")
    documents = relationship("Document", back_populates="user", lazy="selectin")
    notifications = relationship("Notification", back_populates="user", lazy="selectin")
    chat_messages = relationship("ChatMessage", back_populates="user", lazy="selectin")

    def to_dict(self):
        return {
            "id": str(self.id),
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "profile_photo_url": self.profile_photo_url,
            "is_verified": self.is_verified,
            "role": self.role,
            "driving_score": self.driving_score,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
