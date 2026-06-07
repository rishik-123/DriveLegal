"""
Google Gemini AI Client for Astra AI Assistant.
"""
import logging
from typing import Optional

from app.config import settings

logger = logging.getLogger("driveverse.integrations.gemini")

ASTRA_SYSTEM_PROMPT = """You are Astra AI, the intelligent mobility co-pilot for DriveVerse — India's most advanced vehicle management ecosystem.

Your capabilities:
- Vehicle information and status queries
- Traffic rules and regulations for Indian roads (Motor Vehicles Act, 1988)
- Fine amounts and violation information
- Driving license and document guidance
- Insurance and PUC information
- Navigation and route suggestions
- Road safety tips and alerts

Guidelines:
- Always be helpful, accurate, and concise
- Cite specific sections of the Motor Vehicles Act when relevant
- Provide state-specific information when the user's state is known
- Never make up vehicle data — if you don't know, say so
- Support conversations in English, Hindi, and Marathi
- Keep responses under 200 words for chat contexts
- Be friendly but professional — you are a trusted co-pilot
"""

LANGUAGE_PROMPTS = {
    "en": "Respond in English.",
    "hi": "कृपया हिंदी में उत्तर दें। Respond in Hindi.",
    "mr": "कृपया मराठी मध्ये उत्तर द्या। Respond in Marathi.",
}


async def chat_with_astra(
    message: str,
    history: list[tuple[str, str]],
    language: str = "en",
    user_id: Optional[str] = None,
    laws_context: Optional[str] = None,
) -> str:
    """
    Chat with Astra AI using Google Gemini API.

    Args:
        message: User's message
        history: List of (role, content) tuples
        language: Response language (en, hi, mr)
        user_id: Current user ID for context
        laws_context: Optional text containing relevant traffic law statutes.

    Returns:
        AI response text
    """
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        raise ValueError("GEMINI_API_KEY not configured")

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)

        system_instruction = ASTRA_SYSTEM_PROMPT + "\n\n" + LANGUAGE_PROMPTS.get(language, "")
        if laws_context:
            system_instruction += f"\n\nCURRENT REGIONAL TRAFFIC LAWS CONTEXT:\n{laws_context}\nAlways prioritize these local statutes in your response."

        model = genai.GenerativeModel(
            model_name=settings.GEMINI_MODEL,
            system_instruction=system_instruction,
        )

        # Build conversation history
        chat_history = []
        for role, content in history[-8:]:  # Last 8 messages for context
            gemini_role = "user" if role == "user" else "model"
            chat_history.append({"role": gemini_role, "parts": [content]})

        chat = model.start_chat(history=chat_history)
        response = chat.send_message(message)

        logger.info(f"Astra AI response generated for user {user_id}")
        return response.text

    except ImportError:
        logger.error("google-generativeai package not installed. Run: pip install google-generativeai")
        raise
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        raise
