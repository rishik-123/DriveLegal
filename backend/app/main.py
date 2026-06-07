"""
DriveVerse — FastAPI Application Entry Point
One Identity. Every Vehicle Service.
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.config import settings
from app.database import init_db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger("driveverse")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    logger.info("=" * 60)
    logger.info("🚗 DriveVerse Platform Starting...")
    logger.info(f"   Version: {settings.APP_VERSION}")
    logger.info(f"   Debug: {settings.DEBUG}")
    logger.info("=" * 60)

    # Initialize database
    await init_db()
    logger.info("✅ Database initialized")

    # Seed demo user database records
    try:
        from app.seeder import seed_demo_data
        await seed_demo_data()
        logger.info("✅ Demo user data seeded successfully")
    except Exception as e:
        logger.error(f"❌ Failed to seed demo data: {e}", exc_info=True)

    # Check integrations
    if settings.GEMINI_API_KEY:
        logger.info("✅ Gemini AI configured")
    else:
        logger.warning("⚠️  Gemini AI not configured — Astra AI will use fallback responses")

    if settings.GOOGLE_MAPS_API_KEY:
        logger.info("✅ Google Maps configured")
    else:
        logger.warning("⚠️  Google Maps not configured")

    if settings.SMTP_HOST:
        logger.info("✅ SMTP email configured")
    else:
        logger.warning("⚠️  SMTP not configured — OTPs will be logged to console")

    logger.info("🚀 DriveVerse is ready!")
    logger.info("=" * 60)

    yield

    logger.info("DriveVerse shutting down...")


# Create FastAPI application
app = FastAPI(
    title="DriveVerse API",
    description="One Identity. Every Vehicle Service. — India's most advanced vehicle management ecosystem.",
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# ─── Middleware ──────────────────────────────────────────────────

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trusted Hosts
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"] if settings.DEBUG else ["driveverse.in", "*.driveverse.in", "localhost"],
)


# Register Routers
from app.routers.auth import router as auth_router
from app.routers.vehicles import router as vehicles_router
from app.routers.challans import router as challans_router
from app.routers.assistant import router as assistant_router
from app.routers.documents import doc_router, notif_router
from app.routers.laws import router as laws_router

app.include_router(auth_router)
app.include_router(vehicles_router)
app.include_router(challans_router)
app.include_router(assistant_router)
app.include_router(doc_router)
app.include_router(notif_router)
app.include_router(laws_router)


# Health Check

@app.get("/api/health")
async def health_check():
    """API health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "integrations": {
            "gemini_ai": bool(settings.GEMINI_API_KEY),
            "google_maps": bool(settings.GOOGLE_MAPS_API_KEY),
            "smtp_email": bool(settings.SMTP_HOST),
            "sms_otp": False,
            "digilocker": bool(settings.DIGILOCKER_CLIENT_ID),
            "google_oauth": bool(settings.GOOGLE_OAUTH_CLIENT_ID),
        },
    }


@app.get("/api/config/public")
async def public_config():
    """Public configuration for frontend (no secrets)."""
    return {
        "app_name": settings.APP_NAME,
        "google_maps_api_key": settings.GOOGLE_MAPS_API_KEY or "",
        "google_oauth_client_id": settings.GOOGLE_OAUTH_CLIENT_ID or "",
        "features": {
            "google_maps": bool(settings.GOOGLE_MAPS_API_KEY),
            "google_oauth": bool(settings.GOOGLE_OAUTH_CLIENT_ID),
            "astra_ai": bool(settings.GEMINI_API_KEY),
            "digilocker": bool(settings.DIGILOCKER_CLIENT_ID),
            "sms_otp": False,
        },
    }
