"""TrafficLaw model for location-specific road regulations."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Float, Text
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class TrafficLaw(Base):
    __tablename__ = "traffic_laws"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    country = Column(String(10), nullable=False, default="IN")  # IN, US, AE
    state = Column(String(100), nullable=True, index=True)
    city = Column(String(100), nullable=True, index=True)
    section = Column(String(50), nullable=False, index=True)
    rule_description = Column(Text, nullable=False)
    category = Column(String(50), nullable=True)  # Speed, Parking, Helmet, License, etc.
    fine_amount = Column(Float, nullable=False, default=500.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": str(self.id),
            "country": self.country,
            "state": self.state,
            "city": self.city,
            "section": self.section,
            "rule_description": self.rule_description,
            "category": self.category,
            "fine_amount": self.fine_amount,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
