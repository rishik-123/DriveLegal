"""Document vault and notification API routes."""
import logging
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.database import get_db
from app.models.document import Document
from app.models.notification import Notification
from app.utils.security import decode_token

logger = logging.getLogger("driveverse.documents")
doc_router = APIRouter(prefix="/api/documents", tags=["Documents"])
notif_router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


async def get_current_user_id(request: Request) -> str:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(auth_header.split(" ")[1])
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload["sub"]


# ─── Documents ───────────────────────────────────────────────────

@doc_router.get("")
async def list_documents(
    request: Request,
    doc_type: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """List all documents for the user."""
    user_id = await get_current_user_id(request)
    query = select(Document).where(Document.user_id == user_id)
    if doc_type:
        query = query.where(Document.doc_type == doc_type)
    query = query.order_by(Document.created_at.desc())

    result = await db.execute(query)
    docs = result.scalars().all()
    return {"documents": [d.to_dict() for d in docs], "count": len(docs)}


@doc_router.post("/digilocker/connect")
async def connect_digilocker(request: Request, db: AsyncSession = Depends(get_db)):
    """Initiate DigiLocker OAuth connection."""
    user_id = await get_current_user_id(request)

    try:
        from app.integrations.digilocker_client import get_auth_url
        auth_url = await get_auth_url(user_id)
        return {"status": "redirect", "auth_url": auth_url}
    except Exception as e:
        logger.warning(f"DigiLocker integration not configured: {e}")
        return {
            "status": "unavailable",
            "message": "DigiLocker integration requires partner registration. This feature will be available once credentials are configured.",
        }


# ─── Notifications ───────────────────────────────────────────────

@notif_router.get("")
async def list_notifications(
    request: Request,
    category: Optional[str] = Query(None),
    unread_only: bool = Query(False),
    db: AsyncSession = Depends(get_db),
):
    """List notifications for the user."""
    user_id = await get_current_user_id(request)
    query = select(Notification).where(Notification.user_id == user_id)
    if category:
        query = query.where(Notification.category == category)
    if unread_only:
        query = query.where(Notification.is_read == False)
    query = query.order_by(Notification.created_at.desc()).limit(50)

    result = await db.execute(query)
    notifs = result.scalars().all()
    return {"notifications": [n.to_dict() for n in notifs], "count": len(notifs)}


@notif_router.put("/{notification_id}/read")
async def mark_read(notification_id: str, request: Request, db: AsyncSession = Depends(get_db)):
    """Mark a notification as read."""
    user_id = await get_current_user_id(request)
    result = await db.execute(
        select(Notification).where(Notification.id == notification_id, Notification.user_id == user_id)
    )
    notif = result.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.is_read = True
    await db.commit()
    return {"status": "success"}


@notif_router.put("/read-all")
async def mark_all_read(request: Request, db: AsyncSession = Depends(get_db)):
    """Mark all notifications as read."""
    user_id = await get_current_user_id(request)
    result = await db.execute(
        select(Notification).where(Notification.user_id == user_id, Notification.is_read == False)
    )
    notifs = result.scalars().all()
    for n in notifs:
        n.is_read = True
    await db.commit()
    return {"status": "success", "count": len(notifs)}
