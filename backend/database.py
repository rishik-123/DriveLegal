import os
import json
import logging
import numpy as np
from sqlalchemy import (
    create_engine, Column, Integer, String, Text, Float, JSON, 
    TypeDecorator
)
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.types import ARRAY
# Configure logger
logger = logging.getLogger("drivelegal.database")
logging.basicConfig(level=logging.INFO)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/drivelegal")

# Attempt to import pgvector. If not installed, create a resilient custom type
HAS_PGVECTOR = False
try:
    from pgvector.sqlalchemy import Vector
    HAS_PGVECTOR = True
    logger.info("pgvector package successfully imported. Using native Vector type.")
except ImportError:
    logger.warning("pgvector package not found. Creating resilient fallback using ARRAY(Float).")

# Define the Embedding type dynamically based on pgvector availability
if HAS_PGVECTOR:
    EmbeddingType = Vector(1536)
else:
    class EmbeddingTypeDecorator(TypeDecorator):
        impl = Text
        cache_ok = True
        
        def process_bind_param(self, value, dialect):
            if value is None:
                return None
            if isinstance(value, str):
                return value
            return json.dumps(list(value))

        def process_result_value(self, value, dialect):
            if value is None:
                return None
            if isinstance(value, str):
                return np.array(json.loads(value), dtype=np.float32)
            return np.array(value, dtype=np.float32)
            
    EmbeddingType = EmbeddingTypeDecorator()

Base = declarative_base()

class TrafficLaw(Base):
    __tablename__ = 'traffic_laws'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    state = Column(String(100), nullable=True, index=True)
    city = Column(String(100), nullable=True, index=True)
    section = Column(String(50), nullable=False, index=True)
    rule_description = Column(Text, nullable=False)
    vector_embedding = Column(EmbeddingType, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "state": self.state,
            "city": self.city,
            "section": self.section,
            "rule_description": self.rule_description
        }

class FineSchedule(Base):
    __tablename__ = 'fine_schedules'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    violation_name = Column(String(255), nullable=False, unique=True, index=True)
    base_fine = Column(Float, nullable=False)
    penalty_multiplier = Column(Float, nullable=False, default=1.0)
    legal_section = Column(String(50), nullable=False, index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "violation_name": self.violation_name,
            "base_fine": self.base_fine,
            "penalty_multiplier": self.penalty_multiplier,
            "legal_section": self.legal_section
        }

class UserSession(Base):
    __tablename__ = 'user_sessions'
    
    session_id = Column(String(100), primary_key=True, index=True)
    phone_number = Column(String(20), nullable=True, index=True)
    last_known_state = Column(String(100), nullable=True)
    last_known_city = Column(String(100), nullable=True)
    context_history = Column(JSON, nullable=False, default=list)

    def to_dict(self):
        return {
            "session_id": self.session_id,
            "phone_number": self.phone_number,
            "last_known_state": self.last_known_state,
            "last_known_city": self.last_known_city,
            "context_history": self.context_history
        }

class DocumentExtraction(Base):
    __tablename__ = 'document_extractions'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(100), nullable=False, index=True)
    doc_type = Column(String(50), nullable=False, index=True)  # Challan, License, RC
    extracted_text = Column(Text, nullable=False)
    metadata_json = Column(JSON, nullable=False, default=dict)
    status = Column(String(50), nullable=False, default="unpaid") # unpaid, paid, appealed

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "doc_type": self.doc_type,
            "extracted_text": self.extracted_text,
            "metadata_json": self.metadata_json,
            "status": self.status
        }

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False, unique=True, index=True)
    phone_number = Column(String(20), nullable=False, unique=True, index=True)
    aadhaar_no = Column(String(20), nullable=True, unique=True, index=True)
    is_verified = Column(Integer, default=0) # 0 = false, 1 = true
    mfa_token = Column(String(10), nullable=True)
    mfa_expiry = Column(Float, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone_number": self.phone_number,
            "aadhaar_no": self.aadhaar_no,
            "is_verified": self.is_verified == 1
        }

class Vehicle(Base):
    __tablename__ = 'vehicles'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    vehicle_no = Column(String(20), nullable=False, unique=True, index=True)
    owner_name = Column(String(100), nullable=False)
    maker_model = Column(String(100), nullable=False)
    registration_date = Column(String(50), nullable=False)
    insurance_expiry = Column(String(50), nullable=False)
    puc_expiry = Column(String(50), nullable=False)
    aadhaar_no = Column(String(20), nullable=False, index=True) # Linked Aadhaar in RTO database
    user_id = Column(String(100), nullable=True, index=True) # ID of owner when claimed

    def to_dict(self):
        return {
            "id": self.id,
            "vehicle_no": self.vehicle_no,
            "owner_name": self.owner_name,
            "maker_model": self.maker_model,
            "registration_date": self.registration_date,
            "insurance_expiry": self.insurance_expiry,
            "puc_expiry": self.puc_expiry,
            "aadhaar_no": self.aadhaar_no,
            "user_id": self.user_id
        }

# Python fallback for cosine similarity computation
def cosine_similarity_fallback(v1, v2):
    vec1 = np.array(v1, dtype=np.float32)
    vec2 = np.array(v2, dtype=np.float32)
    dot_product = np.dot(vec1, vec2)
    norm_v1 = np.linalg.norm(vec1)
    norm_v2 = np.linalg.norm(vec2)
    if norm_v1 == 0 or norm_v2 == 0:
        return 0.0
    return float(dot_product / (norm_v1 * norm_v2))

# Database engine initialization helper
fallback_sqlite_url = "sqlite:///drivelegal_fallback.db"

# Connection test and dynamic fallback logic
try:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    with engine.connect() as conn:
        pass
    logger.info("Successfully connected to primary database.")
except Exception as conn_err:
    logger.warning(
        f"Primary database connection failed or driver missing ({conn_err}). "
        f"Elegantly falling back to database-agnostic SQLite context: {fallback_sqlite_url}"
    )
    DATABASE_URL = fallback_sqlite_url
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    global engine, SessionLocal
    # Only attempt vector extension on PostgreSQL dialects
    if "postgresql" in str(engine.url):
        try:
            with engine.connect() as conn:
                from sqlalchemy import text
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                conn.commit()
                logger.info("Successfully executed CREATE EXTENSION IF NOT EXISTS vector.")
        except Exception as e:
            logger.warning(f"Failed to create pgvector extension: {e}. Using resilient python similarity fallback.")
        
    try:
        Base.metadata.create_all(bind=engine)
        logger.info(f"Database tables initialized successfully on: {engine.url}")
    except Exception as e:
        logger.warning(f"Initial schema creation failed: {e}. Attempting emergency recovery on fallback SQLite...")
        try:
            # Re-bind engine and sessionmaker to local fallback DB
            DATABASE_URL = fallback_sqlite_url
            engine = create_engine(DATABASE_URL, pool_pre_ping=True)
            SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
            Base.metadata.create_all(bind=engine)
            logger.info("Database emergency recovery complete. Tables created on SQLite fallback database.")
        except Exception as recovery_err:
            logger.error(f"Critical error: Emergency database recovery failed: {recovery_err}")
            raise recovery_err

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
