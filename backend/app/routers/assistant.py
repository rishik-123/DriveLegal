"""Astra AI Assistant API routes."""
import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.chat_message import ChatMessage
from app.schemas.challan import AssistantChatRequest, AssistantChatResponse
from app.utils.security import decode_token

logger = logging.getLogger("driveverse.assistant")
router = APIRouter(prefix="/api/assistant", tags=["Astra AI"])


async def get_current_user_id(request: Request) -> str:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(auth_header.split(" ")[1])
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload["sub"]


@router.post("/chat", response_model=AssistantChatResponse)
async def chat(req: AssistantChatRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Chat with Astra AI assistant."""
    user_id = await get_current_user_id(request)

    # Save user message
    user_msg = ChatMessage(
        user_id=user_id,
        role="user",
        content=req.message,
        language=req.language,
    )
    db.add(user_msg)

    # Get conversation history (last 10 messages)
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.user_id == user_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(10)
    )
    history = result.scalars().all()
    history.reverse()

    # Build laws context from coordinates if provided
    laws_context = None
    if req.latitude is not None and req.longitude is not None:
        try:
            from app.routers.laws import reverse_geocode
            from app.models.traffic_law import TrafficLaw
            country, state, city = reverse_geocode(req.latitude, req.longitude)
            
            # Query laws for this region
            query = select(TrafficLaw).where(
                TrafficLaw.country == country,
                TrafficLaw.state == state
            )
            laws_result = await db.execute(query)
            laws = laws_result.scalars().all()
            if laws:
                laws_context = f"Region: {city}, {state}, {country}\n" + "\n".join(
                    [f"- [{l.section}] {l.rule_description} (Fine: {l.fine_amount})" for l in laws]
                )
        except Exception as err:
            logger.warning(f"Failed to resolve laws context for assistant: {err}")

    # Build context and call Gemini
    try:
        from app.integrations.gemini_client import chat_with_astra
        response_text = await chat_with_astra(
            message=req.message,
            history=[(m.role, m.content) for m in history],
            language=req.language,
            user_id=user_id,
            laws_context=laws_context,
        )
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        # Fallback response
        language_greetings = {
            "en": "I'm Astra AI, your intelligent mobility co-pilot. I can help you with vehicle information, traffic rules, navigation, and more. The AI service is temporarily unavailable — please try again shortly.",
            "hi": "मैं Astra AI हूं, आपका बुद्धिमान मोबिलिटी सह-पायलट। मैं वाहन जानकारी, यातायात नियमों, नेविगेशन और अन्य में आपकी मदद कर सकता हूं। AI सेवा अस्थायी रूप से अनुपलब्ध है।",
            "mr": "मी Astra AI आहे, तुमचा बुद्धिमान मोबिलिटी सह-पायलट. मी वाहन माहिती, वाहतूक नियम, नेव्हिगेशन आणि बरेच काही यात तुम्हाला मदत करू शकतो. AI सेवा तात्पुरती अनुपलब्ध आहे.",
        }
        response_text = language_greetings.get(req.language, language_greetings["en"])

    # Save assistant response
    assistant_msg = ChatMessage(
        user_id=user_id,
        role="assistant",
        content=response_text,
        language=req.language,
    )
    db.add(assistant_msg)
    await db.commit()

    return AssistantChatResponse(
        response=response_text,
        language=req.language,
    )


@router.get("/history")
async def chat_history(request: Request, db: AsyncSession = Depends(get_db)):
    """Get chat history."""
    user_id = await get_current_user_id(request)

    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.user_id == user_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(50)
    )
    messages = result.scalars().all()
    messages.reverse()

    return {"messages": [m.to_dict() for m in messages]}


@router.delete("/history")
async def clear_history(request: Request, db: AsyncSession = Depends(get_db)):
    """Clear chat history."""
    user_id = await get_current_user_id(request)

    result = await db.execute(select(ChatMessage).where(ChatMessage.user_id == user_id))
    messages = result.scalars().all()
    for msg in messages:
        await db.delete(msg)
    await db.commit()

    return {"status": "success", "message": "Chat history cleared"}
