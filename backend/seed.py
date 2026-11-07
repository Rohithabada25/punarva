import os
from datetime import datetime, timedelta
from dotenv import load_dotenv

dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=dotenv_path, override=False)

from db import engine, SessionLocal, Base
from models import User, Listing, Request, Offer, Impact, Notification, ExchangeEvent
from auth import hash_password

def seed_database():
    print("Dropping and recreating tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Check if already seeded
        existing_users = db.query(User).count()
        if existing_users > 0:
            print(f"Database already has {existing_users} users. Cleaning old data...")
            db.query(ExchangeEvent).delete()
            db.query(Notification).delete()
            db.query(Impact).delete()
            db.query(Offer).delete()
            db.query(Request).delete()
            db.query(Listing).delete()
            db.query(User).delete()
            db.commit()

        default_pw = hash_password("punarva123")
        print("Seeding Users with hashed passwords...")
        users_data = [
            # Sellers
            User(name="Rajesh Sharma", email="rajesh@punarva.demo", password_hash=default_pw, role="seller", city="Bapatla", lat=15.9042, lng=80.4674, preferred_language="en"),
            User(name="Venkat Rao", email="venkat@punarva.demo", password_hash=default_pw, role="seller", city="Bapatla", lat=15.9120, lng=80.4710, preferred_language="te"),
            User(name="Lakshmi Devi", email="lakshmi@punarva.demo", password_hash=default_pw, role="seller", city="Chirala", lat=15.8246, lng=80.3522, preferred_language="te"),
            User(name="Priya Patel", email="priya@punarva.demo", password_hash=default_pw, role="seller", city="Guntur", lat=16.3020, lng=80.4280, preferred_language="hi"),
            # Buyers
            User(name="Suresh Kumar", email="suresh@punarva.demo", password_hash=default_pw, role="buyer", city="Guntur", lat=16.3067, lng=80.4365, preferred_language="en"),
            User(name="Ananya Reddy", email="ananya@punarva.demo", password_hash=default_pw, role="buyer", city="Bapatla", lat=15.8980, lng=80.4550, preferred_language="te"),
            User(name="Amit Verma", email="amit@punarva.demo", password_hash=default_pw, role="buyer", city="Guntur", lat=16.2910, lng=80.4420, preferred_language="hi"),
            User(name="Manoj Naidu", email="manoj@punarva.demo", password_hash=default_pw, role="buyer", city="Bapatla", lat=15.9010, lng=80.4620, preferred_language="te"),
            User(name="Ravi Teja", email="ravi@punarva.demo", password_hash=default_pw, role="buyer", city="Tenali", lat=16.2430, lng=80.6400, preferred_language="te"),
            # Organizations / Colleges / NGOs
            User(name="Bapatla Eng College (Civil Lab)", email="bec_civil@punarva.demo", password_hash=default_pw, role="org", city="Bapatla", lat=15.9080, lng=80.4580, preferred_language="en"),
            User(name="Chirala Rural Upliftment Trust", email="chirala_ngo@punarva.demo", password_hash=default_pw, role="org", city="Chirala", lat=15.8150, lng=80.3450, preferred_language="te"),
            User(name="Guntur Eco Shelter Project", email="eco_shelter@punarva.demo", password_hash=default_pw, role="org", city="Guntur", lat=16.3150, lng=80.4480, preferred_language="en"),
            # Administrator
            User(name="Admin Punarva", email="admin@punarva.demo", password_hash=default_pw, role="admin", city="Bapatla", lat=15.9042, lng=80.4674, preferred_language="en"),
        ]

        db.add_all(users_data)
        db.commit()

        # Refresh users map
        users = {u.name: u for u in db.query(User).all()}

        print("Seeding Listings...")
        listings_data = [
            # 1. Red bricks - Listed
            Listing(
                seller_id=users["Rajesh Sharma"].id,
                title="Leftover Red Clay Bricks (First Class)",
                material="Red clay bricks",
                category="construction",
                quantity=450.0,
                unit="pieces",
                weight_kg=1350.0,
                quantity_source="manual",
                quantity_verified=True,
                confidence=0.95,
                condition="good",
                price=3150.0,
                is_free=False,
                status="listed",
                image_url="https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=600&q=80",
                reuse_recommendation="High compressive strength leftover bricks suitable for garden boundary walls, paving or small outhouse masonry.",
                reuse_sources=["IS 1077 Common Burnt Clay Bricks Guide", "CPWD Guidelines on Reclaimed Bricks"],
                hazard_flag=False,
                created_at=datetime.utcnow() - timedelta(days=2)
            ),
            # 2. Fly ash bricks - Completed with impact
            Listing(
                seller_id=users["Rajesh Sharma"].id,
                title="Surplus Fly Ash Bricks for Paving",
                material="Fly ash bricks",
                category="construction",
                quantity=300.0,
                unit="pieces",
                weight_kg=840.0,
                quantity_source="manual",
                quantity_verified=True,
                confidence=0.92,
                condition="new",
                price=1800.0,
                is_free=False,
                status="completed",
                image_url="https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80",
                reuse_recommendation="Zero-waste fly ash bricks can be laid directly for walkways or shed foundations.",
                reuse_sources=["Bureau of Indian Standards IS 3812", "Green Building Materials Directory"],
                hazard_flag=False,
                pickup_date="2026-11-04",
                pickup_window="10:00 AM - 1:00 PM",
                pickup_note="Loading assistance available from rear gate",
                seller_confirmed=True,
                buyer_confirmed=True,
                completed_at=datetime.utcnow() - timedelta(days=1),
                created_at=datetime.utcnow() - timedelta(days=4)
            ),
            # 3. Ultratech Cement bags - Offer received
            Listing(
                seller_id=users["Venkat Rao"].id,
                title="Sealed Ultratech PPC Cement Bags",
                material="Cement bags",
                category="construction",
                quantity=6.0,
                unit="bags",
                weight_kg=300.0,
                quantity_source="manual",
                quantity_verified=True,
                confidence=0.90,
                condition="new",
                price=1900.0,
                is_free=False,
                status="offer_received",
                image_url="https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80",
                reuse_recommendation="Use within 30 days for plastering, flooring mortar or compound wall footings.",
                reuse_sources=["IS 1489 Portland Pozzolana Cement Guidelines"],
                hazard_flag=False,
                created_at=datetime.utcnow() - timedelta(hours=30)
            ),
            # 4. River Sand - Pickup Arranged
            Listing(
                seller_id=users["Venkat Rao"].id,
                title="Washed River Sand (Coarse Grade)",
                material="River sand",
                category="construction",
                quantity=1.5,
                unit="tons",
                weight_kg=1500.0,
                quantity_source="manual",
                quantity_verified=True,
                confidence=0.88,
                condition="good",
                price=2200.0,
                is_free=False,
                status="pickup_arranged",
                image_url="https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=600&q=80",
                reuse_recommendation="Great for concrete mix or masonry bedding.",
                reuse_sources=["CPWD Specifications for Mortar Aggregates"],
                hazard_flag=False,
                pickup_date="2026-11-08",
                pickup_window="2:00 PM - 5:00 PM",
                pickup_note="Park tractor or pickup truck near the west shed",
                seller_confirmed=False,
                buyer_confirmed=False,
                created_at=datetime.utcnow() - timedelta(days=3)
            ),
            # 5. Vitrified Tiles - Disputed
            Listing(
                seller_id=users["Lakshmi Devi"].id,
                title="Glossy Vitrified Floor Tiles (2x2 ft)",
                material="Ceramic tiles",
                category="tiles",
                quantity=40.0,
                unit="sqft",
                weight_kg=220.0,
                quantity_source="ai_estimate",
                quantity_verified=False,
                confidence=0.78,
                condition="fair",
                price=950.0,
                is_free=False,
                status="disputed",
                image_url="https://images.unsplash.com/photo-1502005229762-ee1b2b8ab98f?auto=format&fit=crop&w=600&q=80",
                reuse_recommendation="Tile mosaic flooring or balcony skirting.",
                reuse_sources=["Ceramic Tile Repurposing & Craft Guide"],
                hazard_flag=True,
                hazard_note="Sharp chipped edges on 5 tiles. Wear protective gloves during loading.",
                pickup_date="2026-11-05",
                pickup_window="11:00 AM - 1:00 PM",
                pickup_note="Near Chirala market lane",
                seller_confirmed=True,
                buyer_confirmed=False,
                dispute_reason="wrong_quantity",
                dispute_note="Buyer reports only 25 sqft were usable and 15 sqft were fractured. Seller claims count was accurate at loading.",
                disputed_at=datetime.utcnow() - timedelta(hours=14),
                created_at=datetime.utcnow() - timedelta(days=5)
            ),
            # 6. Teak Wood Window Frames - Listed
            Listing(
                seller_id=users["Lakshmi Devi"].id,
                title="Salvaged Burma Teak Window Frames",
                material="Teak wood",
                category="wood",
                quantity=3.0,
                unit="pieces",
                weight_kg=60.0,
                quantity_source="manual",
                quantity_verified=True,
                confidence=0.92,
                condition="good",
                price=3200.0,
                is_free=False,
                status="listed",
                image_url="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80",
                reuse_recommendation="Sand and polish for rustic frames, mirror borders, or study table framing.",
                reuse_sources=["Timber Salvage and Refinishing Handbook"],
                hazard_flag=False,
                created_at=datetime.utcnow() - timedelta(days=1)
            ),
            # 7. Commercial Plywood Sheets - Completed with impact
            Listing(
                seller_id=users["Priya Patel"].id,
                title="Uncut Plywood Sheets 19mm Commercial Grade",
                material="Plywood sheets",
                category="wood",
                quantity=4.0,
                unit="sheets",
                weight_kg=88.0,
                quantity_source="manual",
                quantity_verified=True,
                confidence=0.95,
                condition="new",
                price=3600.0,
                is_free=False,
                status="completed",
                image_url="https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=600&q=80",
                reuse_recommendation="Perfect for shelves, kitchen cabinets or partition paneling.",
                reuse_sources=["Engineered Wood Reuse Guidelines"],
                hazard_flag=False,
                pickup_date="2026-11-03",
                pickup_window="9:00 AM - 12:00 PM",
                seller_confirmed=True,
                buyer_confirmed=True,
                completed_at=datetime.utcnow() - timedelta(days=2),
                created_at=datetime.utcnow() - timedelta(days=6)
            ),
            # 8. Solid Wooden Chairs - Accepted
            Listing(
                seller_id=users["Priya Patel"].id,
                title="Sturdy Sheesham Wood Dining Chairs (Set of 4)",
                material="Wooden chairs",
                category="furniture",
                quantity=4.0,
                unit="pieces",
                weight_kg=28.0,
                quantity_source="manual",
                quantity_verified=True,
                confidence=0.89,
                condition="good",
                price=2400.0,
                is_free=False,
                status="accepted",
                image_url="https://images.unsplash.com/photo-1580481077111-534a74246830?auto=format&fit=crop&w=600&q=80",
                reuse_recommendation="Re-cushioning and varnish will bring back showroom finish.",
                reuse_sources=["Furniture Restoration Guide"],
                hazard_flag=False,
                created_at=datetime.utcnow() - timedelta(days=2)
            ),
            # 9. TMT Rebars - Listed
            Listing(
                seller_id=users["Rajesh Sharma"].id,
                title="Leftover Fe-550 TMT Steel Bars (12mm)",
                material="Steel TMT bars",
                category="metals",
                quantity=120.0,
                unit="kg",
                weight_kg=120.0,
                quantity_source="manual",
                quantity_verified=True,
                confidence=0.94,
                condition="good",
                price=5500.0,
                is_free=False,
                status="listed",
                image_url="https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=600&q=80",
                reuse_recommendation="Use for slab reinforcements, lintel ties or security grills.",
                reuse_sources=["IS 1786 High Strength Deformed Steel Bars"],
                hazard_flag=True,
                hazard_note="Heavy and sharp wire-tied ends. Transport with flagged red cloth.",
                created_at=datetime.utcnow() - timedelta(hours=18)
            ),
            # 10. Heavy Duty PVC Pipes - Pickup Arranged
            Listing(
                seller_id=users["Venkat Rao"].id,
                title="PVC Drainage Pipes (4 inch diameter)",
                material="PVC pipes",
                category="plastics",
                quantity=18.0,
                unit="meters",
                weight_kg=27.0,
                quantity_source="manual",
                quantity_verified=True,
                confidence=0.91,
                condition="good",
                price=1100.0,
                is_free=False,
                status="pickup_arranged",
                image_url="https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&w=600&q=80",
                reuse_recommendation="Agricultural sub-surface irrigation or rainwater downspouts.",
                reuse_sources=["Plastics Piping Institute Agricultural Standards"],
                hazard_flag=False,
                pickup_date="2026-11-09",
                pickup_window="10:00 AM - 12:00 PM",
                pickup_note="Direct access to pickup driveway",
                seller_confirmed=False,
                buyer_confirmed=False,
                created_at=datetime.utcnow() - timedelta(days=2)
            ),
            # 11. Industrial Blue HDPE Drums - Free/Donation Listed
            Listing(
                seller_id=users["Rajesh Sharma"].id,
                title="HDPE 200-Litre Storage Barrels (Triple Washed)",
                material="HDPE plastic barrels",
                category="plastics",
                quantity=4.0,
                unit="pieces",
                weight_kg=40.0,
                quantity_source="manual",
                quantity_verified=True,
                confidence=0.96,
                condition="good",
                price=0.0,
                is_free=True,
                status="listed",
                image_url="https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80",
                reuse_recommendation="Cut in half for organic composting planters or rainwater catchment.",
                reuse_sources=["Circular Economy Plastic Drum Repurposing Guide"],
                hazard_flag=False,
                created_at=datetime.utcnow() - timedelta(hours=12)
            ),
            # 12. Copper Cables & Conduits - Completed
            Listing(
                seller_id=users["Priya Patel"].id,
                title="Remnant Copper Multi-strand Wiring and Conduits",
                material="Electrical conduit cables",
                category="electronics",
                quantity=45.0,
                unit="meters",
                weight_kg=9.0,
                quantity_source="ai_estimate",
                quantity_verified=False,
                confidence=0.82,
                condition="good",
                price=1200.0,
                is_free=False,
                status="completed",
                image_url="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80",
                reuse_recommendation="Secondary distribution circuits or workshop bench cabling.",
                reuse_sources=["National Electrical Code (NEC) Safe Wire Reuse"],
                hazard_flag=False,
                seller_confirmed=True,
                buyer_confirmed=True,
                completed_at=datetime.utcnow() - timedelta(days=3),
                created_at=datetime.utcnow() - timedelta(days=7)
            ),
            # 13. Rare Industrial Electronics Scrap (No-Match demo candidate)
            Listing(
                seller_id=users["Rajesh Sharma"].id,
                title="Defunct Industrial 3-Phase Inverter PCB & Transformers",
                material="Electronic e-waste",
                category="electronics",
                quantity=35.0,
                unit="kg",
                weight_kg=35.0,
                quantity_source="manual",
                quantity_verified=True,
                confidence=0.90,
                condition="poor",
                price=700.0,
                is_free=False,
                status="listed",
                image_url="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
                reuse_recommendation="Component de-soldering for copper coils and ferrite cores or certified recycling.",
                reuse_sources=["E-Waste Management Rules 2022 (India)", "Electronic Scrap Metal Recovery Guide"],
                hazard_flag=True,
                hazard_note="Contains heavy solder, capacitors, and lead traces. Do not burn or crush.",
                created_at=datetime.utcnow() - timedelta(hours=6)
            ),
        ]

        db.add_all(listings_data)
        db.commit()

        # Fetch created listings
        listings = {l.title: l for l in db.query(Listing).all()}

        print("Seeding Buyer Requests (Wanted)...")
        requests_data = [
            Request(buyer_id=users["Suresh Kumar"].id, material="Red clay bricks", quantity=400.0, budget=3500.0, lat=16.3067, lng=80.4365, is_org=False),
            Request(buyer_id=users["Ananya Reddy"].id, material="Red clay bricks", quantity=200.0, budget=1600.0, lat=15.8980, lng=80.4550, is_org=False),
            Request(buyer_id=users["Bapatla Eng College (Civil Lab)"].id, material="Fly ash bricks", quantity=300.0, budget=2000.0, lat=15.9080, lng=80.4580, is_org=True),
            Request(buyer_id=users["Bapatla Eng College (Civil Lab)"].id, material="Cement bags", quantity=5.0, budget=1800.0, lat=15.9080, lng=80.4580, is_org=True),
            Request(buyer_id=users["Amit Verma"].id, material="Cement bags", quantity=6.0, budget=2100.0, lat=16.2910, lng=80.4420, is_org=False),
            Request(buyer_id=users["Manoj Naidu"].id, material="River sand", quantity=2.0, budget=2500.0, lat=15.9010, lng=80.4620, is_org=False),
            Request(buyer_id=users["Chirala Rural Upliftment Trust"].id, material="Teak wood", quantity=4.0, budget=3500.0, lat=15.8150, lng=80.3450, is_org=True),
            Request(buyer_id=users["Ravi Teja"].id, material="Plywood sheets", quantity=4.0, budget=3800.0, lat=16.2430, lng=80.6400, is_org=False),
            Request(buyer_id=users["Guntur Eco Shelter Project"].id, material="Wooden chairs", quantity=6.0, budget=3000.0, lat=16.3150, lng=80.4480, is_org=True),
            Request(buyer_id=users["Suresh Kumar"].id, material="Steel TMT bars", quantity=100.0, budget=6000.0, lat=16.3067, lng=80.4365, is_org=False),
            Request(buyer_id=users["Ananya Reddy"].id, material="HDPE plastic barrels", quantity=2.0, budget=800.0, lat=15.8980, lng=80.4550, is_org=False),
            Request(buyer_id=users["Manoj Naidu"].id, material="PVC pipes", quantity=20.0, budget=1200.0, lat=15.9010, lng=80.4620, is_org=False),
        ]
        db.add_all(requests_data)
        db.commit()

        print("Seeding Offers...")
        offers_data = [
            # Listing 3 (Cement) - 2 offers
            Offer(listing_id=listings["Sealed Ultratech PPC Cement Bags"].id, buyer_id=users["Amit Verma"].id, price=1850.0, message="Can collect today evening in my utility van.", status="pending"),
            Offer(listing_id=listings["Sealed Ultratech PPC Cement Bags"].id, buyer_id=users["Bapatla Eng College (Civil Lab)"].id, price=1750.0, message="Needed for student masonry lab testing.", status="pending"),
            # Listing 4 (Sand) - 1 accepted offer
            Offer(listing_id=listings["Washed River Sand (Coarse Grade)"].id, buyer_id=users["Manoj Naidu"].id, price=2100.0, message="I have a trailer ready in Bapatla.", status="accepted"),
            # Listing 5 (Tiles) - disputed offer
            Offer(listing_id=listings["Glossy Vitrified Floor Tiles (2x2 ft)"].id, buyer_id=users["Ananya Reddy"].id, price=900.0, message="Taking all tiles for outdoor patio mosaic.", status="accepted"),
            # Listing 8 (Chairs) - accepted offer
            Offer(listing_id=listings["Sturdy Sheesham Wood Dining Chairs (Set of 4)"].id, buyer_id=users["Guntur Eco Shelter Project"].id, price=2200.0, message="Will repurpose for the community hall.", status="accepted"),
            # Listing 10 (PVC Pipes) - accepted offer
            Offer(listing_id=listings["PVC Drainage Pipes (4 inch diameter)"].id, buyer_id=users["Manoj Naidu"].id, price=1050.0, message="Will collect on Monday morning.", status="accepted"),
        ]
        db.add_all(offers_data)
        db.commit()

        print("Seeding Impact records for completed listings...")
        impacts_data = [
            # 2. Fly ash bricks (completed, verified)
            Impact(
                listing_id=listings["Surplus Fly Ash Bricks for Paving"].id,
                kg_diverted=840.0,
                co2_saved=126.0,  # 840 kg * 0.15
                money_saved=1800.0,
                is_estimated=False,
                created_at=datetime.utcnow() - timedelta(days=1)
            ),
            # 7. Commercial Plywood Sheets (completed, verified)
            Impact(
                listing_id=listings["Uncut Plywood Sheets 19mm Commercial Grade"].id,
                kg_diverted=88.0,
                co2_saved=96.8,  # 88 kg * 1.10
                money_saved=3600.0,
                is_estimated=False,
                created_at=datetime.utcnow() - timedelta(days=2)
            ),
            # 12. Copper Cables (completed, unverified AI estimate -> is_estimated=True)
            Impact(
                listing_id=listings["Remnant Copper Multi-strand Wiring and Conduits"].id,
                kg_diverted=9.0,
                co2_saved=30.6,  # 9 kg * 3.4
                money_saved=1200.0,
                is_estimated=True,
                created_at=datetime.utcnow() - timedelta(days=3)
            )
        ]
        db.add_all(impacts_data)
        db.commit()

        print("Seeding Notifications...")
        notifications_data = [
            Notification(
                user_id=users["Venkat Rao"].id,
                type="offer_received",
                message_key="notif.offer_received",
                params={"buyer_name": "Amit Verma", "listing_title": "Sealed Ultratech PPC Cement Bags", "amount": 1850.0},
                is_read=False,
                created_at=datetime.utcnow() - timedelta(hours=2)
            ),
            Notification(
                user_id=users["Manoj Naidu"].id,
                type="pickup_arranged",
                message_key="notif.pickup_arranged",
                params={"listing_title": "Washed River Sand (Coarse Grade)", "date": "2026-11-08"},
                is_read=False,
                created_at=datetime.utcnow() - timedelta(hours=5)
            ),
            Notification(
                user_id=users["Admin Punarva"].id,
                type="dispute_reported",
                message_key="notif.dispute_reported",
                params={"listing_id": listings["Glossy Vitrified Floor Tiles (2x2 ft)"].id, "seller_name": "Lakshmi Devi"},
                is_read=False,
                created_at=datetime.utcnow() - timedelta(hours=14)
            )
        ]
        db.add_all(notifications_data)
        db.commit()

        print("Seeding Exchange Events audit log...")
        events_data = [
            ExchangeEvent(listing_id=listings["Surplus Fly Ash Bricks for Paving"].id, actor_id=users["Rajesh Sharma"].id, event="LISTING_PUBLISHED"),
            ExchangeEvent(listing_id=listings["Surplus Fly Ash Bricks for Paving"].id, actor_id=users["Bapatla Eng College (Civil Lab)"].id, event="OFFER_ACCEPTED"),
            ExchangeEvent(listing_id=listings["Surplus Fly Ash Bricks for Paving"].id, actor_id=users["Rajesh Sharma"].id, event="SELLER_CONFIRMED"),
            ExchangeEvent(listing_id=listings["Surplus Fly Ash Bricks for Paving"].id, actor_id=users["Bapatla Eng College (Civil Lab)"].id, event="BUYER_CONFIRMED"),
            ExchangeEvent(listing_id=listings["Surplus Fly Ash Bricks for Paving"].id, actor_id=None, event="IMPACT_CALCULATED"),
            ExchangeEvent(listing_id=listings["Glossy Vitrified Floor Tiles (2x2 ft)"].id, actor_id=users["Ananya Reddy"].id, event="DISPUTE_RAISED"),
        ]
        db.add_all(events_data)
        db.commit()

        print("Seeding completed successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
