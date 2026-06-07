"""FineSchedule model for traffic violation fee calculator parameters."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Float
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class FineSchedule(Base):
    __tablename__ = "fine_schedules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    country = Column(String(10), nullable=False, default="IN")  # IN, US, AE
    violation_name = Column(String(255), nullable=False, index=True)
    base_fine = Column(Float, nullable=False)
    penalty_multiplier = Column(Float, nullable=False, default=1.0)
    legal_section = Column(String(50), nullable=False, index=True)
    vehicle_type = Column(String(50), nullable=False, default="Car")  # Car, Two-wheeler, Commercial
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": str(self.id),
            "country": self.country,
            "violation_name": self.violation_name,
            "base_fine": self.base_fine,
            "penalty_multiplier": self.penalty_multiplier,
            "legal_section": self.legal_section,
            "vehicle_type": self.vehicle_type,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
