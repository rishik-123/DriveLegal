import os
import io
import logging
import numpy as np
from sqlalchemy.orm import Session
from database import TrafficLaw, HAS_PGVECTOR, cosine_similarity_fallback

# Configure logger
logger = logging.getLogger("drivelegal.rag_pipeline")
logging.basicConfig(level=logging.INFO)

class LegalRAG:
    def __init__(self):
        self.embedding_model = "text-embedding-3-small"
        logger.info("LegalRAG Pipeline initialized.")

    def get_embedding(self, text: str) -> list:
        """
        Generates 1536-dimensional OpenAI embedding vector for query text.
        Falls back to a deterministic, normalized mock vector if OpenAI is offline or credentials are unset.
        """
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key or api_key == "mock-key":
            logger.warning("OPENAI_API_KEY not set. Using deterministic, normalized mock embedding fallback.")
            # Generate a deterministic mock vector based on the text hash for local offline testing
            # Use a robust hash to create seed
            text_seed = abs(hash(text)) % (2**32)
            rng = np.random.default_rng(text_seed)
            mock_vec = rng.normal(size=1536).astype(np.float32)
            norm = np.linalg.norm(mock_vec)
            if norm > 0:
                mock_vec = mock_vec / norm
            return mock_vec.tolist()
            
        try:
            from openai import OpenAI
            client = OpenAI(api_key=api_key)
            response = client.embeddings.create(
                input=[text],
                model=self.embedding_model
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"OpenAI embedding creation failed: {e}. Falling back to deterministic mock vector.")
            text_seed = abs(hash(text)) % (2**32)
            rng = np.random.default_rng(text_seed)
            mock_vec = rng.normal(size=1536).astype(np.float32)
            norm = np.linalg.norm(mock_vec)
            if norm > 0:
                mock_vec = mock_vec / norm
            return mock_vec.tolist()

    def retrieve_hierarchical(self, db: Session, query_text: str, state: str = None, city: str = None, limit: int = 3) -> list:
        """
        Executes hierarchical vector search to retrieve relevant driving compliance regulations.
        Hierarchy logic:
        1. If local 'city' and 'state' are provided, check for city-specific laws matching query.
        2. If empty, check for state-level laws (city=None).
        3. If still empty, fall back to national traffic laws (state=None, city=None).
        """
        query_emb = self.get_embedding(query_text)
        
        # Step 1: Query for local city laws
        if city and state:
            logger.info(f"RAG Retrieval Step 1: Querying city-level laws for {city}, {state}...")
            city_results = self._query_db_vector(db, query_emb, state=state, city=city, limit=limit)
            if city_results:
                logger.info(f"Hierarchical Match Found: {len(city_results)} city laws retrieved.")
                return city_results
                
        # Step 2: Fall back to state-level laws
        if state:
            logger.info(f"RAG Retrieval Step 2: Querying state-level laws for {state}...")
            state_results = self._query_db_vector(db, query_emb, state=state, city=None, limit=limit)
            if state_results:
                logger.info(f"Hierarchical Match Found: {len(state_results)} state laws retrieved.")
                return state_results
                
        # Step 3: Fall back to national laws
        logger.info("RAG Retrieval Step 3: Querying national-level traffic laws...")
        national_results = self._query_db_vector(db, query_emb, state=None, city=None, limit=limit)
        logger.info(f"Hierarchical Fallback Match Found: {len(national_results)} national laws retrieved.")
        return national_results

    def _query_db_vector(self, db: Session, query_emb: list, state: str = None, city: str = None, limit: int = 3) -> list:
        """
        Performs localized filtering and vector distance search.
        Resolves similarity queries using native pgvector if active, else using Python+NumPy cosine similarity.
        """
        # Apply strict regional metadata filters
        q = db.query(TrafficLaw)
        
        if state:
            q = q.filter(TrafficLaw.state.ilike(state))
        else:
            q = q.filter(TrafficLaw.state == None)
            
        if city:
            q = q.filter(TrafficLaw.city.ilike(city))
        else:
            q = q.filter(TrafficLaw.city == None)
            
        # Execute Vector search
        if HAS_PGVECTOR:
            try:
                # Cosine distance operator '<->' in pgvector maps to cosine_distance in SQLAlchemy
                distance = TrafficLaw.vector_embedding.cosine_distance(query_emb)
                laws_with_dist = q.order_by(distance).limit(limit).all()
                return laws_with_dist
            except Exception as e:
                logger.warning(f"Native pgvector query failed: {e}. Falling back to local python similarity logic.")
        
        # Resilient SQLite/PostgreSQL-fallback without pgvector: calculate similarity in python
        all_candidate_laws = q.all()
        if not all_candidate_laws:
            return []
            
        scored_laws = []
        for law in all_candidate_laws:
            if law.vector_embedding is not None:
                sim = cosine_similarity_fallback(query_emb, law.vector_embedding)
                scored_laws.append((law, sim))
                
        # Sort descending by cosine similarity score
        scored_laws.sort(key=lambda x: x[1], reverse=True)
        return [law for law, sim in scored_laws[:limit]]


def transcribe_voice(audio_bytes: bytes) -> dict:
    """
    Transcribes multilingual voice recordings (e.g. from WhatsApp/Telegram)
    to text using OpenAI's Whisper API model 'whisper-1'.
    Includes a robust mock structure when key is unavailable for off-line hackathon validation.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key == "mock-key":
        logger.warning("No active OpenAI API credentials found. Simulating voice transcription.")
        # Perform dynamic text signature parsing from binary if provided, else use standard multi-lingual test response
        try:
            audio_text = audio_bytes.decode('utf-8', errors='ignore')
            if "speed" in audio_text.lower():
                return {"text": "What is the speed limit around IIT Madras campus?"}
            if "fine" in audio_text.lower() or "challan" in audio_text.lower():
                return {"text": "I got a ticket for speeding. How much is the fine?"}
            if "helmet" in audio_text.lower():
                return {"text": "Is wearing a helmet mandatory on service roads?"}
        except Exception:
            pass
        return {"text": "IIT Madras के पास गति सीमा क्या है?"} # Default mock multi-lingual transcription (Hindi)
        
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        
        # Package audio bytes into in-memory file for multipart compliance
        audio_file = io.BytesIO(audio_bytes)
        audio_file.name = "voice.mp3"  # Extension required by Whisper API
        
        response = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file
        )
        logger.info("Whisper voice transcription completed successfully.")
        return {"text": response.text}
    except Exception as e:
        logger.error(f"Whisper transcription failed: {e}")
        return {"text": "Audio transcription failed. Please submit your request via text."}
