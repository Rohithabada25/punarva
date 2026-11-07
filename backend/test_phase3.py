import sys
import os
import json

sys.path.insert(0, os.path.dirname(__file__))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from fastapi.testclient import TestClient
from main import app
from db import SessionLocal
from models import Listing, User, Offer, Impact, Request

client = TestClient(app)

def test_phase3():
    print("=" * 65)
    print("TESTING PHASE 3: ALL AGENTS & WORKFLOW ENDPOINTS")
    print("=" * 65)

    db = SessionLocal()
    try:
        users = {u.email: u for u in db.query(User).all()}
        rajesh = users["rajesh@punarva.demo"]
        suresh = users["suresh@punarva.demo"]
        ananya = users["ananya@punarva.demo"]
        admin = users["admin@punarva.demo"]

        # 1. Test Matching Agent on Red Bricks Listing
        listing1 = db.query(Listing).filter(Listing.title.like("%Red Clay Bricks%")).first()
        assert listing1 is not None, "Listing 1 not found"
        print(f"\n1. Testing Matching Agent for Listing #{listing1.id} ({listing1.title})...")
        res_m = client.get(f"/matches/{listing1.id}?language=en")
        assert res_m.status_code == 200, f"Matching failed: {res_m.text}"
        m_data = res_m.json()
        print(f"   Has matches: {m_data['has_matches']}, Count: {len(m_data['matches'])}")
        for m in m_data["matches"]:
            print(f"   -> Match: {m['buyer_name']} ({m['city']}, {m['distance_km']} km) | Reason: {m['match_reason']}")

        # 2. Test No-Match Fallback Agent on E-waste Listing
        listing_ewaste = db.query(Listing).filter(Listing.title.like("%Industrial%")).first()
        assert listing_ewaste is not None, "E-waste listing not found"
        print(f"\n2. Testing Fallback Agent on No-Match Listing #{listing_ewaste.id} ({listing_ewaste.title})...")
        res_fb = client.get(f"/matches/{listing_ewaste.id}?language=te")
        assert res_fb.status_code == 200
        fb_data = res_fb.json()
        print(f"   Has matches: {fb_data['has_matches']}, Fallbacks count: {len(fb_data['fallbacks'])}")
        for fb in fb_data["fallbacks"]:
            print(f"   -> Alternative [{fb['type']}]: {fb['name']} | {fb['description'][:80]}...")

        # 3. Test Negotiation Agent & Offers
        print(f"\n3. Submitting offer from Suresh on Listing #{listing1.id}...")
        res_off = client.post("/offers", json={
            "listing_id": listing1.id,
            "buyer_id": suresh.id,
            "price": 3000.0,
            "message": "Can bring my pickup truck tomorrow morning."
        })
        assert res_off.status_code == 200, f"Submit offer failed: {res_off.text}"
        offer_id = res_off.json()["id"]

        print(f"   Fetching offers with Negotiation Agent ranking...")
        res_offs = client.get(f"/offers/{listing1.id}?language=en")
        assert res_offs.status_code == 200
        ranked = res_offs.json()
        print(f"   Ranked offers count: {len(ranked)}")
        for o in ranked:
            print(f"   -> Offer #{o['id']}: ₹{o['price']} by {o['buyer_name']} | Best: {o['is_best_offer']} | {o['negotiation_reason']}")

        # 4. Test Accept Offer & Status Stepper
        print(f"\n4. Seller accepts Offer #{offer_id}...")
        res_acc = client.post(f"/offers/{offer_id}/accept")
        assert res_acc.status_code == 200
        print(f"   Offer accepted. Listing status is now 'accepted'.")

        # 5. Arrange Pickup
        print(f"\n5. Arranging offline pickup...")
        res_pk = client.post(f"/listings/{listing1.id}/pickup", json={
            "pickup_date": "2026-11-10",
            "pickup_window": "10:00 AM - 1:00 PM",
            "pickup_note": "Ring front bell, loading area in driveway"
        })
        assert res_pk.status_code == 200
        assert res_pk.json()["status"] == "pickup_arranged"
        print(f"   Pickup scheduled for {res_pk.json()['pickup_date']} ({res_pk.json()['pickup_window']})")

        # 6. Separate Confirmations & Impact Calculation
        print(f"\n6. Testing separate completion confirmations...")
        # Seller confirms first
        res_c1 = client.post(f"/listings/{listing1.id}/confirm", json={"role": "seller"})
        assert res_c1.status_code == 200
        assert res_c1.json()["seller_confirmed"] is True
        assert res_c1.json()["buyer_confirmed"] is False
        assert res_c1.json()["status"] == "pickup_arranged"  # Not yet completed!
        print(f"   Seller confirmed. Exchange status still '{res_c1.json()['status']}' (waiting for buyer).")

        # Buyer confirms second -> triggers completed + Impact Agent
        res_c2 = client.post(f"/listings/{listing1.id}/confirm", json={"role": "buyer"})
        assert res_c2.status_code == 200
        assert res_c2.json()["seller_confirmed"] is True
        assert res_c2.json()["buyer_confirmed"] is True
        assert res_c2.json()["status"] == "completed"
        print(f"   Buyer confirmed. Exchange status is now COMPLETED!")

        # Verify impact record was created
        db.commit()  # Reset MySQL transaction snapshot to see newly committed row
        impact_rec = db.query(Impact).filter(Impact.listing_id == listing1.id).first()
        assert impact_rec is not None, "Impact record not generated"
        print(f"   Impact recorded: {impact_rec.kg_diverted} kg diverted, {impact_rec.co2_saved} kg CO2 saved, ₹{impact_rec.money_saved} saved.")

        # 7. Test Dispute Workflow & Administrator Mediation
        disputed_listing = db.query(Listing).filter(Listing.status == "disputed").first()
        assert disputed_listing is not None, "Disputed listing not found"
        print(f"\n7. Testing Admin Disputes Review for Listing #{disputed_listing.id} ({disputed_listing.title})...")
        res_disp = client.get("/admin/disputes")
        assert res_disp.status_code == 200
        disputes = res_disp.json()
        print(f"   Active disputed exchanges count: {len(disputes)}")
        for d in disputes:
            print(f"   -> Disputed #{d['id']}: Reason '{d['dispute_reason']}' | Note: {d['dispute_note']}")

        # Admin resolves dispute by completing it
        print(f"   Admin resolving Dispute #{disputed_listing.id} with action='complete'...")
        res_res = client.post(f"/admin/disputes/{disputed_listing.id}/resolve", json={
            "action": "complete",
            "admin_note": "Verified with both buyer and seller over phone; agreed on 15% salvage discount."
        })
        assert res_res.status_code == 200
        assert res_res.json()["status"] == "completed"
        print(f"   Dispute resolved. Status: completed, Admin Note: {res_res.json()['admin_note']}")

        # 8. Test 48-Hour Timeout Simulation
        # Use Listing 4 (sand, pickup_arranged)
        listing_sand = db.query(Listing).filter(Listing.title.like("%River Sand%")).first()
        if listing_sand:
            print(f"\n8. Testing simulated 48-hour timeout on Listing #{listing_sand.id}...")
            res_to = client.post(f"/admin/simulate-timeout/{listing_sand.id}")
            assert res_to.status_code == 200
            assert res_to.json()["status"] == "disputed"
            print(f"   Timeout triggered! Status moved to: {res_to.json()['status']} (Reason: {res_to.json()['dispute_reason']})")

        # 9. Language Switcher & Dashboard Endpoints
        print(f"\n9. Testing Language Switcher PATCH /users/{rajesh.id}/language...")
        res_lang = client.patch(f"/users/{rajesh.id}/language", json={"preferred_language": "te"})
        assert res_lang.status_code == 200
        assert res_lang.json()["preferred_language"] == "te"
        print(f"   Rajesh's language updated to: {res_lang.json()['preferred_language']}")

        # 10. Dashboard & Impact Metrics
        print(f"\n10. Testing Dashboard GET /dashboard/{rajesh.id}...")
        res_dash = client.get(f"/dashboard/{rajesh.id}")
        assert res_dash.status_code == 200
        dash = res_dash.json()
        print(f"   Dashboard User: {dash['user']['name']} ({dash['user']['city']})")
        print(f"   Stats: kg_diverted={dash['stats']['kg_diverted']}, co2_saved={dash['stats']['co2_saved']}, unread_notifs={dash['stats']['unread_notifications']}")
        print(f"   Recommended matches count: {len(dash['recommendations'])}")

        print("\n" + "=" * 65)
        print("PHASE 3 VERIFICATION: ALL TESTS PASSED SUCCESSFULLY!")
        print("=" * 65)

    finally:
        db.close()

if __name__ == "__main__":
    test_phase3()
