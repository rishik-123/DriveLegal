"""DigiLocker OAuth integration client."""
import logging
from app.config import settings

logger = logging.getLogger("driveverse.integrations.digilocker")

DIGILOCKER_AUTH_URL = "https://api.digitallocker.gov.in/public/oauth2/1/authorize"
DIGILOCKER_TOKEN_URL = "https://api.digitallocker.gov.in/public/oauth2/1/token"


async def get_auth_url(user_id: str) -> str:
    """Generate DigiLocker OAuth authorization URL."""
    if not settings.DIGILOCKER_CLIENT_ID:
        raise ValueError("DIGILOCKER_CLIENT_ID not configured. Partner registration required.")

    params = {
        "response_type": "code",
        "client_id": settings.DIGILOCKER_CLIENT_ID,
        "redirect_uri": settings.DIGILOCKER_REDIRECT_URI,
        "state": user_id,
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return f"{DIGILOCKER_AUTH_URL}?{query}"
