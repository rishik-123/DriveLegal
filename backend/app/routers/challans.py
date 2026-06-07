"""Challan management API routes."""
import logging
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.database import get_db
from app.models.challan import Challan
from app.models.vehicle import Vehicle
from app.utils.security import decode_token

logger = logging.getLogger("driveverse.challans")
router = APIRouter(prefix="/api/challans", tags=["Challans"])


async def get_current_user_id(request: Request) -> str:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(auth_header.split(" ")[1])
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload["sub"]


@router.get("")
async def list_challans(
    request: Request,
    vehicle_id: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
):
    """List all challans for the user's vehicles."""
    user_id = await get_current_user_id(request)

    query = select(Challan).where(Challan.user_id == user_id)
    if vehicle_id:
        query = query.where(Challan.vehicle_id == vehicle_id)
    if status_filter:
        query = query.where(Challan.status == status_filter)

    query = query.order_by(Challan.created_at.desc())
    result = await db.execute(query)
    challans = result.scalars().all()

    return {"challans": [c.to_dict() for c in challans], "count": len(challans)}


@router.get("/{challan_id}")
async def get_challan(challan_id: str, request: Request, db: AsyncSession = Depends(get_db)):
    """Get challan details."""
    user_id = await get_current_user_id(request)
    result = await db.execute(select(Challan).where(Challan.id == challan_id, Challan.user_id == user_id))
    challan = result.scalar_one_or_none()
    if not challan:
        raise HTTPException(status_code=404, detail="Challan not found")
    return challan.to_dict()


@router.post("/check")
async def check_challans(request: Request, db: AsyncSession = Depends(get_db)):
    """Check for pending challans across user's vehicles via e-Challan API."""
    user_id = await get_current_user_id(request)

    # Get user's vehicles
    result = await db.execute(select(Vehicle).where(Vehicle.user_id == user_id))
    vehicles = result.scalars().all()

    if not vehicles:
        return {"status": "info", "message": "No vehicles found. Add a vehicle first.", "challans": []}

    # Try e-Challan API for each vehicle
    all_challans = []
    for vehicle in vehicles:
        try:
            from app.integrations.echallan_client import check_vehicle_challans
            vehicle_challans = await check_vehicle_challans(vehicle.registration_number)
            all_challans.extend(vehicle_challans)
        except Exception as e:
            logger.warning(f"e-Challan API unavailable for {vehicle.registration_number}: {e}")

    if not all_challans:
        return {
            "status": "unavailable",
            "message": "e-Challan lookup service is not currently available. Challans can be added manually.",
            "challans": [],
        }

    return {"status": "success", "challans": all_challans}


@router.post("/{challan_id}/pay")
async def initiate_payment(challan_id: str, request: Request, db: AsyncSession = Depends(get_db)):
    """Initiate challan payment."""
    user_id = await get_current_user_id(request)
    result = await db.execute(select(Challan).where(Challan.id == challan_id, Challan.user_id == user_id))
    challan = result.scalar_one_or_none()
    if not challan:
        raise HTTPException(status_code=404, detail="Challan not found")

    if challan.status == "paid":
        raise HTTPException(status_code=400, detail="Challan is already paid")

    # In production, this would redirect to the official payment portal
    return {
        "status": "redirect",
        "message": "Redirecting to official e-Challan payment portal",
        "payment_url": "https://echallan.parivahan.gov.in/",
        "challan": challan.to_dict(),
    }
