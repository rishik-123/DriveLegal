"""Database seeding script for premium demo/test user data, traffic laws, and fine schedules."""
import logging
from datetime import date, datetime, timedelta
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.challan import Challan
from app.models.document import Document
from app.models.notification import Notification
from app.models.traffic_law import TrafficLaw
from app.models.fine_schedule import FineSchedule
from app.utils.security import hash_password

logger = logging.getLogger("driveverse.seeder")


async def seed_demo_data():
    """Seeds the database with high-fidelity demo users and global traffic regulations."""
    async with AsyncSessionLocal() as session:
        try:
            # ─── CLEANUP EXISTING DATA ────────────────────────────────────
            logger.info("Cleaning up existing seeder records...")
            
            # Fetch users to clean up their relations
            user_emails = ["demo@driveverse.in", "jashthakkar77@gmail.com"]
            res = await session.execute(select(User).where(User.email.in_(user_emails)))
            existing_users = res.scalars().all()
            
            for u in existing_users:
                await session.execute(delete(Notification).where(Notification.user_id == u.id))
                await session.execute(delete(Document).where(Document.user_id == u.id))
                await session.execute(delete(Challan).where(Challan.user_id == u.id))
                await session.execute(delete(Vehicle).where(Vehicle.user_id == u.id))
                await session.execute(delete(User).where(User.id == u.id))
                
            # Clear laws & fine schedules
            await session.execute(delete(TrafficLaw))
            await session.execute(delete(FineSchedule))
            await session.commit()
            
            logger.info("Database cleaned successfully. Creating fresh data...")
            
            # ─── SEED USERS ────────────────────────────────────────────────
            # Create Jash Thakkar (Primary User)
            jash_user = User(
                name="Jash Thakkar",
                email="jashthakkar77@gmail.com",
                phone="9988776655",
                password_hash=hash_password("Password123!"),
                is_verified=True,
                is_active=True,
                role="user",
                driving_score=98,
                profile_photo_url="https://api.dicebear.com/7.x/adventurer/svg?seed=Jash"
            )
            
            # Create Rohan Sharma (Secondary Demo User)
            rohan_user = User(
                name="Rohan Sharma",
                email="demo@driveverse.in",
                phone="9876543210",
                password_hash=hash_password("Password123!"),
                is_verified=True,
                is_active=True,
                role="user",
                driving_score=94,
                profile_photo_url="https://api.dicebear.com/7.x/adventurer/svg?seed=Rohan"
            )
            
            session.add_all([jash_user, rohan_user])
            await session.commit()
            await session.refresh(jash_user)
            await session.refresh(rohan_user)
            
            # ─── SEED VEHICLES & DOCUMENTS FOR JASH THAKKAR ────────────────
            # Jash's Indian SUV
            jv1 = Vehicle(
                user_id=jash_user.id,
                registration_number="MH12JT7777",
                owner_name="Jash Thakkar",
                vehicle_type="Car",
                vehicle_class="LMV",
                fuel_type="Petrol",
                make="Hyundai",
                model="Creta",
                chassis_number_masked="*7777",
                registration_date=date.today() - timedelta(days=365),
                insurance_provider="HDFC ERGO General Insurance",
                insurance_policy_number="HDFC-INS-7777",
                insurance_expiry=date.today() + timedelta(days=240),
                puc_valid_until=date.today() + timedelta(days=90),
                rto_office="Pune Central RTO",
                state="Maharashtra",
                data_source="vahan_api",
                nickname="Primary SUV"
            )
            
            # Jash's Dubai Sports Car
            jv2 = Vehicle(
                user_id=jash_user.id,
                registration_number="DXBA7777",
                owner_name="Jash Thakkar",
                vehicle_type="Car",
                vehicle_class="Light Vehicle",
                fuel_type="Electric",
                make="Tesla",
                model="Model Y",
                chassis_number_masked="*9999",
                registration_date=date.today() - timedelta(days=120),
                insurance_provider="Oman Insurance Company",
                insurance_policy_number="OIC-INS-7777",
                insurance_expiry=date.today() + timedelta(days=340),
                puc_valid_until=None,  # Electric
                rto_office="RTA Dubai",
                state="Dubai",
                data_source="vahan_api",
                nickname="Dubai Cruiser"
            )
            
            # Jash's California Motorcycle
            jv3 = Vehicle(
                user_id=jash_user.id,
                registration_number="CA7XYZ77",
                owner_name="Jash Thakkar",
                vehicle_type="Motorcycle",
                vehicle_class="MCWG",
                fuel_type="Petrol",
                make="Royal Enfield",
                model="Himalayan 450",
                chassis_number_masked="*8888",
                registration_date=date.today() - timedelta(days=200),
                insurance_provider="GEICO Insurance",
                insurance_policy_number="GEICO-MTR-7777",
                insurance_expiry=date.today() + timedelta(days=15),  # Expiring soon!
                puc_valid_until=date.today() - timedelta(days=5),  # Expired!
                rto_office="DMV Los Angeles",
                state="California",
                data_source="vahan_api",
                nickname="LA Bike"
            )
            
            session.add_all([jv1, jv2, jv3])
            await session.commit()
            await session.refresh(jv1)
            await session.refresh(jv2)
            await session.refresh(jv3)
            
            # Add Documents for Jash
            jd1 = Document(
                user_id=jash_user.id,
                doc_type="DL",
                title="Driving License (Jash Thakkar)",
                file_url="https://driveverse.in/mock/documents/dl_jash.pdf",
                source="digilocker",
                is_verified=True,
                expiry_date=datetime.utcnow() + timedelta(days=3650),
                metadata_json={
                    "license_no": "MH12 20217777777",
                    "owner_name": "Jash Thakkar",
                    "class": "LMV, MCWG",
                    "issuing_authority": "Pune RTO",
                    "source": "DigiLocker Verified"
                }
            )
            
            jd2 = Document(
                user_id=jash_user.id,
                vehicle_id=jv1.id,
                doc_type="RC",
                title="Registration Certificate (MH12JT7777)",
                file_url="https://driveverse.in/mock/documents/rc_creta.pdf",
                source="digilocker",
                is_verified=True,
                expiry_date=datetime.utcnow() + timedelta(days=4000),
                metadata_json={
                    "vehicle_no": "MH12JT7777",
                    "owner_name": "Jash Thakkar",
                    "class": "LMV",
                    "model": "Hyundai Creta",
                    "engine_no": "G4FL777777",
                    "source": "DigiLocker Verified"
                }
            )
            
            session.add_all([jd1, jd2])
            
            # Seed pending Speeding Challan for Jash
            jc1 = Challan(
                vehicle_id=jv1.id,
                user_id=jash_user.id,
                challan_number="MH-12-SP-77701",
                violation_date=date.today() - timedelta(days=3),
                location="Anna Salai, Chennai",
                violation_type="Over Speeding (Limit 50 km/h, actual 68 km/h)",
                violation_section="Sec 183 MVA",
                amount=2000.0,
                status="pending",
                data_source="echallan_api"
            )
            
            session.add(jc1)
            
            # Add Notifications for Jash
            jn1 = Notification(
                user_id=jash_user.id,
                title="Speeding Infraction Registered 🚨",
                message="A speeding fine (Rs. 2,000) has been registered for vehicle MH12JT7777 in Chennai.",
                category="challan",
                action_url="/dashboard/challans",
                is_read=False,
                created_at=datetime.utcnow() - timedelta(hours=4)
            )
            
            jn2 = Notification(
                user_id=jash_user.id,
                title="California Insurance Expiring Soon ⚠️",
                message="Your GEICO Policy for Himalayan 450 (CA7XYZ77) is expiring in 15 days.",
                category="insurance",
                action_url="/dashboard/insurance",
                is_read=False,
                created_at=datetime.utcnow() - timedelta(days=1)
            )
            
            session.add_all([jn1, jn2])
            
            # ─── SEED VEHICLES & DOCUMENTS FOR ROHAN SHARMA ────────────────
            rv1 = Vehicle(
                user_id=rohan_user.id,
                registration_number="MH12AB1234",
                owner_name="Rohan Sharma",
                vehicle_type="Car",
                vehicle_class="LMV",
                fuel_type="Petrol",
                make="Hyundai",
                model="Creta",
                chassis_number_masked="*5678",
                registration_date=date.today() - timedelta(days=1000),
                insurance_provider="HDFC ERGO General Insurance",
                insurance_policy_number="HDFC-INS-992019",
                insurance_expiry=date.today() + timedelta(days=120),
                puc_valid_until=date.today() + timedelta(days=45),
                rto_office="Pune Central RTO",
                state="Maharashtra",
                data_source="vahan_api",
                nickname="Daily SUV"
            )
            session.add(rv1)
            await session.commit()
            await session.refresh(rv1)
            
            # ─── SEED TRAFFIC LAWS ─────────────────────────────────────────
            logger.info("Seeding global traffic laws...")
            
            laws = [
                # India Laws
                TrafficLaw(
                    country="IN", state="Maharashtra", city="Pune",
                    section="Sec 112 MVA", category="Speed",
                    rule_description="Maximum speed limit for passenger cars inside Pune municipal limits is 40 km/h.",
                    fine_amount=2000.0
                ),
                TrafficLaw(
                    country="IN", state="Tamil Nadu", city="Chennai",
                    section="Sec 129 MVA", category="Helmet",
                    rule_description="Wearing protective headgear conforming to ISI standards is mandatory for all two-wheeler riders and pillions.",
                    fine_amount=1000.0
                ),
                TrafficLaw(
                    country="IN", state="Delhi", city="New Delhi",
                    section="Sec 122 MVA", category="Parking",
                    rule_description="Leaving a vehicle in a public place in an obstructive manner is prohibited in Delhi Central Zones.",
                    fine_amount=500.0
                ),
                TrafficLaw(
                    country="IN", state="Karnataka", city="Bengaluru",
                    section="Sec 185 MVA", category="Drunk Driving",
                    rule_description="Zero-tolerance zone. Driving by a drunken person (Blood Alcohol Level exceeding 30mg per 100ml) is a critical offense.",
                    fine_amount=10000.0
                ),
                # USA Laws
                TrafficLaw(
                    country="US", state="California", city="Los Angeles",
                    section="CVC 22350", category="Speed",
                    rule_description="Basic Speed Law: No person shall drive a vehicle at a speed greater than is reasonable or safe. Campus limits strictly 25 mph.",
                    fine_amount=120.0
                ),
                TrafficLaw(
                    country="US", state="California", city="Los Angeles",
                    section="CVC 27315", category="Seatbelt",
                    rule_description="Mandatory use of seat belts. Every occupant of a moving passenger vehicle must be properly buckled up.",
                    fine_amount=50.0
                ),
                TrafficLaw(
                    country="US", state="New York", city="New York City",
                    section="NY VTL 1201", category="Parking",
                    rule_description="Stopping, standing or parking in active Manhattan bus lanes, fire hydrant zones, or red curbs is strictly illegal.",
                    fine_amount=150.0
                ),
                # UAE Laws
                TrafficLaw(
                    country="AE", state="Dubai", city="Dubai",
                    section="AED 21 Speed", category="Speed",
                    rule_description="Maximum speed limits on urban residential roads is 60 km/h. Main highway limits vary between 80 km/h and 120 km/h.",
                    fine_amount=600.0
                ),
                TrafficLaw(
                    country="AE", state="Dubai", city="Dubai",
                    section="AED 40 Tailgate", category="Safety",
                    rule_description="Tailgating or failing to leave a safe braking distance from the vehicle in front carries a 400 AED fine and 4 black points.",
                    fine_amount=400.0
                ),
                TrafficLaw(
                    country="AE", state="Abu Dhabi", city="Abu Dhabi",
                    section="AED 12 License", category="License",
                    rule_description="Driving a vehicle with an expired driving license or unregistered vehicle plates inside Abu Dhabi Emirate.",
                    fine_amount=500.0
                )
            ]
            session.add_all(laws)
            
            # ─── SEED FINE SCHEDULES (CALCULATOR CONFIGS) ───────────────────
            logger.info("Seeding fine schedules violation rules...")
            
            schedules = [
                # India - Car
                FineSchedule(country="IN", vehicle_type="Car", violation_name="Over Speeding", base_fine=2000.0, penalty_multiplier=2.0, legal_section="Sec 183 MVA"),
                FineSchedule(country="IN", vehicle_type="Car", violation_name="Dangerous/Red Light Driving", base_fine=1000.0, penalty_multiplier=1.5, legal_section="Sec 184 MVA"),
                FineSchedule(country="IN", vehicle_type="Car", violation_name="Driving Without Seatbelt", base_fine=1000.0, penalty_multiplier=1.0, legal_section="Sec 194B MVA"),
                FineSchedule(country="IN", vehicle_type="Car", violation_name="Obstruction / Illegal Parking", base_fine=500.0, penalty_multiplier=1.2, legal_section="Sec 122 MVA"),
                FineSchedule(country="IN", vehicle_type="Car", violation_name="Drunk Driving", base_fine=10000.0, penalty_multiplier=1.5, legal_section="Sec 185 MVA"),
                
                # India - Two-wheeler
                FineSchedule(country="IN", vehicle_type="Two-wheeler", violation_name="Over Speeding", base_fine=1000.0, penalty_multiplier=2.0, legal_section="Sec 183 MVA"),
                FineSchedule(country="IN", vehicle_type="Two-wheeler", violation_name="Riding Without Helmet", base_fine=1000.0, penalty_multiplier=1.5, legal_section="Sec 129 MVA"),
                FineSchedule(country="IN", vehicle_type="Two-wheeler", violation_name="Obstruction / Illegal Parking", base_fine=500.0, penalty_multiplier=1.2, legal_section="Sec 122 MVA"),
                FineSchedule(country="IN", vehicle_type="Two-wheeler", violation_name="Triple Riding", base_fine=1000.0, penalty_multiplier=1.5, legal_section="Sec 194C MVA"),
                
                # USA - Car
                FineSchedule(country="US", vehicle_type="Car", violation_name="Over Speeding", base_fine=120.0, penalty_multiplier=1.5, legal_section="CVC 22350"),
                FineSchedule(country="US", vehicle_type="Car", violation_name="Running Red Light", base_fine=150.0, penalty_multiplier=2.0, legal_section="CVC 21453"),
                FineSchedule(country="US", vehicle_type="Car", violation_name="No Seatbelt", base_fine=50.0, penalty_multiplier=1.0, legal_section="CVC 27315"),
                FineSchedule(country="US", vehicle_type="Car", violation_name="Illegal Parking", base_fine=60.0, penalty_multiplier=1.2, legal_section="CVC 22500"),
                
                # UAE - Car
                FineSchedule(country="AE", vehicle_type="Car", violation_name="Over Speeding", base_fine=600.0, penalty_multiplier=2.0, legal_section="AED 21 Speed"),
                FineSchedule(country="AE", vehicle_type="Car", violation_name="Tailgating / Safe Distance", base_fine=400.0, penalty_multiplier=1.5, legal_section="AED 40 Tailgate"),
                FineSchedule(country="AE", vehicle_type="Car", violation_name="Using Phone While Driving", base_fine=800.0, penalty_multiplier=2.0, legal_section="AED 32 Mobile"),
                FineSchedule(country="AE", vehicle_type="Car", violation_name="No Seatbelt", base_fine=400.0, penalty_multiplier=1.0, legal_section="AED 19 Belt")
            ]
            session.add_all(schedules)
            
            await session.commit()
            logger.info("Database seeding successfully completed!")
            
        except Exception as e:
            await session.rollback()
            logger.error(f"Failed to seed demo data: {e}", exc_info=True)
            raise e
