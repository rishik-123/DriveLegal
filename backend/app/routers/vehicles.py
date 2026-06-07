"""Vehicle management API routes."""
import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.vehicle import Vehicle
from app.models.user import User
from app.schemas.vehicle import VehicleAddRequest, VehicleLookupRequest, VehicleUpdateRequest, VehicleResponse
from app.utils.security import decode_token
from app.utils.validators import validate_vehicle_registration, sanitize_registration_number

logger = logging.getLogger("driveverse.vehicles")
router = APIRouter(prefix="/api/vehicles", tags=["Vehicles"])


async def get_current_user_id(request: Request) -> str:
    """Extract user ID from JWT token."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth_header.split(" ")[1]
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload["sub"]


@router.get("")
async def list_vehicles(request: Request, db: AsyncSession = Depends(get_db)):
    """List all vehicles for the authenticated user."""
    user_id = await get_current_user_id(request)
    result = await db.execute(select(Vehicle).where(Vehicle.user_id == user_id))
    vehicles = result.scalars().all()
    return {"vehicles": [v.to_dict() for v in vehicles], "count": len(vehicles)}


@router.post("")
async def add_vehicle(req: VehicleAddRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Add a vehicle to user's garage."""
    user_id = await get_current_user_id(request)
    reg_no = sanitize_registration_number(req.registration_number)

    if not validate_vehicle_registration(reg_no):
        raise HTTPException(status_code=400, detail="Invalid vehicle registration number format")

    # Check if vehicle already exists
    result = await db.execute(select(Vehicle).where(Vehicle.registration_number == reg_no))
    existing = result.scalar_one_or_none()
    if existing:
        if existing.user_id and str(existing.user_id) == user_id:
            raise HTTPException(status_code=409, detail="Vehicle already in your garage")
        elif existing.user_id:
            raise HTTPException(status_code=409, detail="Vehicle is registered to another user")
        # Claim unclaimed vehicle
        existing.user_id = user_id
        existing.nickname = req.nickname
        await db.commit()
        await db.refresh(existing)
        return {"status": "success", "message": "Vehicle claimed successfully", "vehicle": existing.to_dict()}

    # Try RTO lookup first
    try:
        from app.integrations.vahan_client import lookup_vehicle
        vehicle_data = await lookup_vehicle(reg_no)
    except Exception as e:
        logger.warning(f"RTO lookup failed for {reg_no}: {e}")
        vehicle_data = None

    # Create vehicle
    vehicle = Vehicle(
        user_id=user_id,
        registration_number=reg_no,
        nickname=req.nickname,
        owner_name=vehicle_data.get("owner_name") if vehicle_data else None,
        vehicle_type=vehicle_data.get("vehicle_type") if vehicle_data else None,
        vehicle_class=vehicle_data.get("vehicle_class") if vehicle_data else None,
        fuel_type=vehicle_data.get("fuel_type") if vehicle_data else None,
        make=vehicle_data.get("make") if vehicle_data else None,
        model=vehicle_data.get("model") if vehicle_data else None,
        state=vehicle_data.get("state") if vehicle_data else None,
        registration_date=vehicle_data.get("registration_date") if vehicle_data else None,
        insurance_provider=vehicle_data.get("insurance_provider") if vehicle_data else None,
        insurance_policy_number=vehicle_data.get("insurance_policy_number") if vehicle_data else None,
        insurance_expiry=vehicle_data.get("insurance_expiry") if vehicle_data else None,
        puc_valid_until=vehicle_data.get("puc_valid_until") if vehicle_data else None,
        rto_office=vehicle_data.get("rto_office") if vehicle_data else None,
        chassis_number_masked=vehicle_data.get("chassis_number_masked") if vehicle_data else None,
        data_source="vahan_api" if vehicle_data else "manual",
    )
    db.add(vehicle)
    await db.commit()
    await db.refresh(vehicle)

    return {"status": "success", "message": "Vehicle added to garage", "vehicle": vehicle.to_dict()}


@router.get("/{vehicle_id}")
async def get_vehicle(vehicle_id: str, request: Request, db: AsyncSession = Depends(get_db)):
    """Get vehicle details."""
    user_id = await get_current_user_id(request)
    result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id, Vehicle.user_id == user_id))
    vehicle = result.scalar_one_or_none()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle.to_dict()


@router.put("/{vehicle_id}")
async def update_vehicle(vehicle_id: str, req: VehicleUpdateRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Update vehicle details."""
    user_id = await get_current_user_id(request)
    result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id, Vehicle.user_id == user_id))
    vehicle = result.scalar_one_or_none()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    update_data = req.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(vehicle, key, value)

    await db.commit()
    await db.refresh(vehicle)
    return {"status": "success", "message": "Vehicle updated", "vehicle": vehicle.to_dict()}


@router.delete("/{vehicle_id}")
async def remove_vehicle(vehicle_id: str, request: Request, db: AsyncSession = Depends(get_db)):
    """Remove vehicle from user's garage."""
    user_id = await get_current_user_id(request)
    result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id, Vehicle.user_id == user_id))
    vehicle = result.scalar_one_or_none()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    await db.delete(vehicle)
    await db.commit()
    return {"status": "success", "message": "Vehicle removed from garage"}


@router.post("/lookup")
async def rto_lookup(req: VehicleLookupRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Lookup vehicle details from RTO/Vahan API."""
    await get_current_user_id(request)  # Auth check
    reg_no = sanitize_registration_number(req.registration_number)

    if not validate_vehicle_registration(reg_no):
        raise HTTPException(status_code=400, detail="Invalid vehicle registration number format")

    try:
        from app.integrations.vahan_client import lookup_vehicle
        vehicle_data = await lookup_vehicle(reg_no)
        if vehicle_data:
            return {
                "status": "success",
                "source": "Vahan/RTO API",
                "vehicle": vehicle_data,
            }
        else:
            return {
                "status": "unavailable",
                "message": "RTO lookup service is currently unavailable. Vehicle data will need to be entered manually.",
                "vehicle": {"registration_number": reg_no},
            }
    except Exception as e:
        logger.error(f"RTO lookup error: {e}")
        return {
            "status": "unavailable",
            "message": "RTO lookup service is not configured. Please add vehicle details manually.",
            "vehicle": {"registration_number": reg_no},
        }
