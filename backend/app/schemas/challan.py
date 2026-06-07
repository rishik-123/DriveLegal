"""Challan request/response schemas."""
from pydantic import BaseModel, Field
from typing import Optional


class ChallanCheckRequest(BaseModel):
    registration_number: str = Field(..., min_length=6)


class ChallanPayRequest(BaseModel):
    challan_id: str


class ChallanResponse(BaseModel):
    id: str
    vehicle_id: Optional[str] = None
    challan_number: Optional[str] = None
    violation_date: Optional[str] = None
    location: Optional[str] = None
    violation_type: Optional[str] = None
    violation_section: Optional[str] = None
    amount: Optional[float] = None
    status: str = "pending"
    payment_reference: Optional[str] = None
    data_source: str = "manual"
    created_at: Optional[str] = None


class AssistantChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    language: str = Field(default="en", pattern="^(en|hi|mr)$")
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class AssistantChatResponse(BaseModel):
    response: str
    language: str = "en"
    sources: list[str] = []

