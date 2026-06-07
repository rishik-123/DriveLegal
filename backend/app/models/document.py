"""Document model for the vehicle document vault."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id"), nullable=True, index=True)
    doc_type = Column(String(50), nullable=False, index=True)  # DL, RC, Insurance, PUC, Permit, Aadhaar, PAN
    title = Column(String(200), nullable=True)
    file_url = Column(Text, nullable=True)
    metadata_json = Column(JSON, default={})
    source = Column(String(50), default="upload")  # upload, digilocker, scanned
    is_verified = Column(Boolean, default=False)
    expiry_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="documents")

    def to_dict(self):
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "vehicle_id": str(self.vehicle_id) if self.vehicle_id else None,
            "doc_type": self.doc_type,
            "title": self.title,
            "file_url": self.file_url,
            "metadata": self.metadata_json,
            "source": self.source,
            "is_verified": self.is_verified,
            "expiry_date": self.expiry_date.isoformat() if self.expiry_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
