"""Family member model for shared vehicle management."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class FamilyMember(Base):
    __tablename__ = "family_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    member_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    relationship_type = Column(String(50), nullable=True)  # spouse, child, parent, sibling
    permissions = Column(JSON, default={"view": True, "manage": False})
    created_at = Column(DateTime, default=datetime.utcnow)
