"""
DriveVerse Database Configuration
Async SQLAlchemy with PostgreSQL. Falls back to SQLite for development.
"""
import logging
import uuid
import sys
from sqlalchemy import CHAR, TypeDecorator
from sqlalchemy.dialects.postgresql import UUID as _OriginalUUID

class GUID(TypeDecorator):
    """Platform-independent GUID type.
    
    Uses PostgreSQL's UUID type, and CHAR(32) on SQLite.
    Automatically coerces string representations of UUIDs into UUID objects.
    """
    impl = CHAR
    cache_ok = True

    def __init__(self, as_uuid=True, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.as_uuid = as_uuid

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(_OriginalUUID(as_uuid=self.as_uuid))
        else:
            return dialect.type_descriptor(CHAR(32))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if not isinstance(value, uuid.UUID):
            try:
                value = uuid.UUID(value)
            except ValueError:
                return value
        
        if dialect.name == 'postgresql':
            return value
        else:
            return value.hex

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if isinstance(value, uuid.UUID):
            return value
        try:
            return uuid.UUID(value)
        except ValueError:
            return value

# Apply monkeypatch to fix SQLite compatibility with UUID columns in all models
import sqlalchemy.dialects.postgresql
sqlalchemy.dialects.postgresql.UUID = GUID
sys.modules['sqlalchemy.dialects.postgresql'].UUID = GUID

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

logger = logging.getLogger("driveverse.database")

# Determine database URL - use async driver
db_url = settings.DATABASE_URL
if "sqlite" in db_url:
    db_url = db_url.replace("sqlite://", "sqlite+aiosqlite://")
elif "postgresql://" in db_url and "asyncpg" not in db_url:
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://")

try:
    engine = create_async_engine(
        db_url,
        echo=settings.DEBUG,
        pool_pre_ping=True,
        pool_size=20,
        max_overflow=10,
    )
    logger.info(f"Database engine created for: {db_url.split('@')[-1] if '@' in db_url else db_url}")
except Exception as e:
    logger.warning(f"Primary DB connection failed ({e}). Falling back to SQLite.")
    engine = create_async_engine(
        "sqlite+aiosqlite:///driveverse_fallback.db",
        echo=settings.DEBUG,
    )

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all database models."""
    pass


async def get_db():
    """Dependency that provides a database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """Create all tables. Called on application startup.
    Falls back to SQLite dynamically if PostgreSQL is unreachable.
    """
    global engine, AsyncSessionLocal
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables initialized successfully on primary database.")
    except Exception as e:
        logger.warning(f"Primary DB connection/initialization failed ({e}). Falling back to SQLite.")
        engine = create_async_engine(
            "sqlite+aiosqlite:///driveverse_fallback.db",
            echo=settings.DEBUG,
        )
        AsyncSessionLocal = async_sessionmaker(
            engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables initialized successfully on fallback SQLite database.")
