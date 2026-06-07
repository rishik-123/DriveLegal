"""Challan model for traffic violation management."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Date, DateTime, Text, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class Challan(Base):
    __tablename__ = "challans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id"), nullable=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    challan_number = Column(String(50), nullable=True, unique=True, index=True)
    violation_date = Column(Date, nullable=True)
    location = Column(Text, nullable=True)
    violation_type = Column(String(100), nullable=True)
    violation_section = Column(String(50), nullable=True)
    amount = Column(Numeric(10, 2), nullable=True)
    status = Column(String(20), default="pending")  # pending, paid, under_review, dismissed
    payment_reference = Column(String(100), nullable=True)
    data_source = Column(String(50), default="manual")  # manual, echallan_api, uploaded
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    vehicle = relationship("Vehicle", back_populates="challans")

    def to_dict(self):
        return {
            "id": str(self.id),
            "vehicle_id": str(self.vehicle_id) if self.vehicle_id else None,
            "user_id": str(self.user_id) if self.user_id else None,
            "challan_number": self.challan_number,
            "violation_date": self.violation_date.isoformat() if self.violation_date else None,
            "location": self.location,
            "violation_type": self.violation_type,
            "violation_section": self.violation_section,
            "amount": float(self.amount) if self.amount else None,
            "status": self.status,
            "payment_reference": self.payment_reference,
            "data_source": self.data_source,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
