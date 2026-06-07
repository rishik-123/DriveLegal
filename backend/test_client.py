import os
import io
import json
import logging
import asyncio

# Setup local SQLite db bounds
temp_db_file = os.path.join(os.path.dirname(__file__), "test_drivelegal.db")
os.environ["DATABASE_URL"] = f"sqlite:///{temp_db_file}"

from database import Base, engine, SessionLocal, TrafficLaw, FineSchedule, UserSession, DocumentExtraction
from main import seed_database, geofence_alert, chatbot_webhook, upload_document, get_compliance_analytics
from main import CoordinatePayload, WebhookPayload
import ocr_engine
ocr_engine.get_ocr_reader = lambda: None

# Configure logger
logger = logging.getLogger("drivelegal.test_client")
logging.basicConfig(level=logging.INFO)

def run_integration_tests():
    logger.info("==================================================")
    logger.info("     STARTING DRIVELEGAL DIRECT RUNTIME TESTS     ")
    logger.info("==================================================")
    
    # Initialize DB schemas locally
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Step 1: Seed the Database
    logger.info("\n--- TEST STEP 1: Seeding Road Safety Laws & Fines ---")
    res_data = seed_database(db)
    logger.info(f"Seed DB Result: {res_data}")
    assert res_data["status"] == "success"

    # Step 2: Test Geofence Alert (IIT Madras Coordinates)
    logger.info("\n--- TEST STEP 2: Triggering Geofence Engine (IIT Madras) ---")
    geofence_payload = CoordinatePayload(
        session_id="test_session_iitm_001",
        latitude=12.9915,
        longitude=80.2336,
        phone_number="+919876543210"
    )
    brief_data = geofence_alert(geofence_payload, db)
    logger.info(f"City Mapped: {brief_data.city}")
    logger.info(f"State Mapped: {brief_data.state}")
    logger.info(f"Driving Brief Issued:\n{brief_data.driving_brief}")
    
    assert brief_data.city == "Chennai"
    assert brief_data.state == "Tamil Nadu"
    assert len(brief_data.retrieved_laws) > 0

    # Step 3: Test Webhook Chatbot (General Question)
    logger.info("\n--- TEST STEP 3: Chatbot Conversational Webhook ---")
    webhook_payload = WebhookPayload(
        session_id="test_session_iitm_001",
        phone_number="+919876543210",
        message_text="What is the speed limit within IIT Madras campus?"
    )
    response = chatbot_webhook(webhook_payload, db)
    # Parse FastAPI JSONResponse body
    chat_data = json.loads(response.body.decode('utf-8'))
    logger.info(f"Chatbot Reply: {chat_data['response']}")
    assert chat_data["session_id"] == "test_session_iitm_001"

    # Step 4: Test Multi-lingual Voice Transcription Simulation
    logger.info("\n--- TEST STEP 4: Multilingual Voice Transcription Webhook ---")
    webhook_voice_payload = WebhookPayload(
        session_id="test_session_iitm_001",
        phone_number="+919876543210",
        voice_url="https://drivelegal-audio-bucket.s3.amazonaws.com/voice_clip_04.mp3"
    )
    response = chatbot_webhook(webhook_voice_payload, db)
    voice_chat_data = json.loads(response.body.decode('utf-8'))
    logger.info(f"Voice Chatbot Response: {voice_chat_data['response']}")

    # Step 5: Test Document Upload (OCR Scanner & First Offence Fine)
    logger.info("\n--- TEST STEP 5: Document Upload (First Offence Speeding) ---")
    mock_challan_text = """
    CHALLAN RECEIPT
    Challan No: TN-12-E-9876543
    Vehicle No: TN07BM1234
    Violator Name: RAMESH KUMAR
    Violation Section: Sec 183 MVA
    Fine Amount: Rs. 2000.00
    Driving License: TN0720180012345
    """
    
    # Mock FastAPI UploadFile class
    class MockUploadFile:
        def __init__(self, filename, content):
            self.filename = filename
            self.content = content
        async def read(self):
            return self.content
            
    mock_file = MockUploadFile("challan_test.png", mock_challan_text.encode('utf-8'))
    
    # Invoke document processing directly inside event loop
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    doc_data = loop.run_until_complete(upload_document(
        user_id="+919876543210",
        doc_type="Challan",
        file=mock_file,
        db=db
    ))
    
    logger.info(f"OCR Extracted Challan No: {doc_data.challan_no}")
    logger.info(f"OCR Extracted Vehicle No: {doc_data.vehicle_no}")
    logger.info(f"Fine Amount Found: {doc_data.fine_amount}")
    logger.info(f"Calculated Final Fine (First Offence): Rs. {doc_data.calculated_fine}")
    
    assert doc_data.challan_no == "TN-12-E-9876543"
    assert doc_data.vehicle_no == "TN07BM1234"
    assert doc_data.calculated_fine == 2000.0
    assert doc_data.repeat_offender is False

    # Step 6: Test Repeat Infraction Fine Compounding (Second Offence Speeding)
    logger.info("\n--- TEST STEP 6: Document Upload (Second Offence Fine Compounding) ---")
    
    mock_repeat_challan_text = """
    CHALLAN RECEIPT
    Challan No: TN-12-E-9876544
    Vehicle No: TN07BM1234
    Violator Name: RAMESH KUMAR
    Violation Section: Sec 183 MVA
    Fine Amount: Rs. 2000.00
    Driving License: TN0720180012345
    """
    
    mock_repeat_file = MockUploadFile("challan_repeat.png", mock_repeat_challan_text.encode('utf-8'))
    
    repeat_doc_data = loop.run_until_complete(upload_document(
        user_id="+919876543210",
        doc_type="Challan",
        file=mock_repeat_file,
        db=db
    ))
    
    logger.info(f"OCR Extracted Challan No: {repeat_doc_data.challan_no}")
    logger.info(f"Calculated Final Fine (Second Offence Compounded): Rs. {repeat_doc_data.calculated_fine}")
    logger.info(f"Is Repeat Offender? {repeat_doc_data.repeat_offender}")
    logger.info(f"Infraction Count Detected: {repeat_doc_data.infraction_count}")
    
    assert repeat_doc_data.repeat_offender is True
    assert repeat_doc_data.infraction_count == 1
    assert repeat_doc_data.calculated_fine == 3000.0

    # Step 7: Test Analytics Compiling Endpoint
    logger.info("\n--- TEST STEP 7: Analytics Compiling Endpoint ---")
    analytics_data = get_compliance_analytics(user_id="+919876543210", db=db)
    logger.info(f"Analytics Data: {analytics_data}")
    
    assert analytics_data["compliance_score"] == 80  # Starting at 100, 2 citations scanned => 80
    assert analytics_data["compliance_rating"] == "Good Standing"
    assert analytics_data["total_citations"] == 2
    assert analytics_data["unresolved_citations"] == 2
    assert analytics_data["active_appeals"] == 1
    assert "99." in analytics_data["active_telemetry_status"]
    assert "ms" in analytics_data["rag_retrieval_latency"]
    assert analytics_data["citation_trend"][4]["fine"] == 5000.0  # 2000 base + 3000 repeat

    # Close DB and event loop session
    db.close()
    loop.close()

    logger.info("\n==================================================")
    logger.info("     ALL DRIVELEGAL SYSTEM TESTS PASSED!          ")
    logger.info("==================================================")

    # Cleanup local sqlite db file after testing completes
    try:
        import gc
        engine.dispose()
        gc.collect()
        if os.path.exists(temp_db_file):
            os.remove(temp_db_file)
            logger.info("Temporary test database deleted successfully.")
    except Exception as cleanup_err:
        logger.warning(f"Could not delete temporary test database file: {cleanup_err}")

if __name__ == "__main__":
    run_integration_tests()
