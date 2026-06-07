"""Vehicle model for DriveVerse vehicle management."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Date, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    registration_number = Column(String(20), unique=True, nullable=False, index=True)
    owner_name = Column(String(100), nullable=True)
    vehicle_type = Column(String(50), nullable=True)  # Car, Bike, Truck, etc.
    vehicle_class = Column(String(50), nullable=True)  # LMV, HMV, MCWG, etc.
    fuel_type = Column(String(30), nullable=True)  # Petrol, Diesel, Electric, CNG
    make = Column(String(50), nullable=True)  # Tata, Hyundai, Honda, etc.
    model = Column(String(50), nullable=True)  # Nexon, i20, City, etc.
    engine_number_encrypted = Column(Text, nullable=True)  # AES encrypted
    chassis_number_masked = Column(String(50), nullable=True)  # Last 4 chars visible
    registration_date = Column(Date, nullable=True)
    fitness_valid_until = Column(Date, nullable=True)

    # Insurance
    insurance_provider = Column(String(100), nullable=True)
    insurance_policy_number = Column(String(50), nullable=True)
    insurance_expiry = Column(Date, nullable=True)

    # PUC
    puc_valid_until = Column(Date, nullable=True)

    # RTO
    rto_office = Column(String(100), nullable=True)
    state = Column(String(50), nullable=True)

    # Data tracking
    data_source = Column(String(50), default="manual")  # manual, vahan_api, digilocker
    nickname = Column(String(50), nullable=True)  # User-given name

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="vehicles")
    challans = relationship("Challan", back_populates="vehicle", lazy="selectin")
    geofences = relationship("Geofence", back_populates="vehicle", lazy="selectin")

    def to_dict(self):
        return {
            "id": str(self.id),
            "user_id": str(self.user_id) if self.user_id else None,
            "registration_number": self.registration_number,
            "owner_name": self.owner_name,
            "vehicle_type": self.vehicle_type,
            "vehicle_class": self.vehicle_class,
            "fuel_type": self.fuel_type,
            "make": self.make,
            "model": self.model,
            "chassis_number_masked": self.chassis_number_masked,
            "registration_date": self.registration_date.isoformat() if self.registration_date else None,
            "fitness_valid_until": self.fitness_valid_until.isoformat() if self.fitness_valid_until else None,
            "insurance_provider": self.insurance_provider,
            "insurance_policy_number": self.insurance_policy_number,
            "insurance_expiry": self.insurance_expiry.isoformat() if self.insurance_expiry else None,
            "puc_valid_until": self.puc_valid_until.isoformat() if self.puc_valid_until else None,
            "rto_office": self.rto_office,
            "state": self.state,
            "data_source": self.data_source,
            "nickname": self.nickname,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
