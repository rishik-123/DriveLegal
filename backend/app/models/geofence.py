"""Geofence model for anti-theft zone management."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, Integer, DateTime, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class Geofence(Base):
    __tablename__ = "geofences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id"), nullable=True, index=True)
    name = Column(String(100), nullable=False)
    center_lat = Column(Numeric(10, 7), nullable=False)
    center_lng = Column(Numeric(10, 7), nullable=False)
    radius_meters = Column(Integer, nullable=False, default=500)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    vehicle = relationship("Vehicle", back_populates="geofences")

    def to_dict(self):
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "vehicle_id": str(self.vehicle_id) if self.vehicle_id else None,
            "name": self.name,
            "center_lat": float(self.center_lat),
            "center_lng": float(self.center_lng),
            "radius_meters": self.radius_meters,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
