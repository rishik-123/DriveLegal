"""Vehicle request/response schemas."""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date


class VehicleAddRequest(BaseModel):
    registration_number: str = Field(..., min_length=6, max_length=15)
    nickname: Optional[str] = None


class VehicleLookupRequest(BaseModel):
    registration_number: str = Field(..., min_length=6, max_length=15)


class VehicleUpdateRequest(BaseModel):
    nickname: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_policy_number: Optional[str] = None
    insurance_expiry: Optional[date] = None
    puc_valid_until: Optional[date] = None


class VehicleResponse(BaseModel):
    id: str
    registration_number: str
    owner_name: Optional[str] = None
    vehicle_type: Optional[str] = None
    vehicle_class: Optional[str] = None
    fuel_type: Optional[str] = None
    make: Optional[str] = None
    model: Optional[str] = None
    chassis_number_masked: Optional[str] = None
    registration_date: Optional[str] = None
    fitness_valid_until: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_policy_number: Optional[str] = None
    insurance_expiry: Optional[str] = None
    puc_valid_until: Optional[str] = None
    rto_office: Optional[str] = None
    state: Optional[str] = None
    data_source: str = "manual"
    nickname: Optional[str] = None
    created_at: Optional[str] = None
