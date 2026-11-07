import sys
import os
import io
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from fastapi.testclient import TestClient
from main import app
from db import SessionLocal
from models import Listing, User, Offer, Impact, Request, ExchangeEvent

client = TestClient(app)

def create_dummy_jpeg():
    img = Image.new("RGB", (300, 300), color=(180, 80, 50))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)
    return buf.getvalue()

def test_full_pipeline():
    print("=" * 70)
    print("PUNARVA FULL E2E SYSTEM INTEGRATION TEST")
    print("=" * 70)

    db = SessionLocal()
    try:
        users = {u.email: u for u in db.query(User).all()}
        rajesh = users["rajesh@punarva.demo"]     # Seller
        suresh = users["suresh@punarva.demo"]     # Buyer
        ananya = users["ananya@punarva.demo"]     # Buyer
        admin = users["admin@punarva.demo"]       # Admin

        # ---------------------------------------------------------
        # TEST 1: LangGraph Image Analysis Pipeline (Vision -> Reuse -> Pricing)
        # ---------------------------------------------------------
        print("\n[Step 1] POST /listings/analyze with image and language='te' (Telugu)...")
        jpeg_bytes = create_dummy_jpeg()
        res = client.post(
            "/listings/analyze",
            files={"file": ("red_bricks.jpg", jpeg_bytes, "image/jpeg")},
            data={"language": "te"}
        )
        assert res.status_code == 200, f"Analysis failed: {res.text}"
        data = res.json()
        print(f"  ✓ Vision detected: {data['material_type']} ({data['category']})")
        print(f"  ✓ Estimated quantity: {data['estimated_quantity']} {data['unit']} (Confidence: {data['confidence']})")
        print(f"  ✓ Suggested price: ₹{data['suggested_price']} (Range: ₹{data['price_range']['min']} - ₹{data['price_range']['max']})")
        print(f"  ✓ Reuse Agent citation sources: {data['reuse_sources']}")
        print(f"  ✓ Agent Trace steps: {[t['agent'] + ' (' + t['status'] + ')' for t in data['agent_trace']]}")
        assert len(data['agent_trace']) >= 3, "Expected at least 3 agent trace entries"

        # ---------------------------------------------------------
        # TEST 2: Seller Creates Listing with Manual Quantity Verification
        # ---------------------------------------------------------
        print("\n[Step 2] POST /listings (Seller verifies quantity manually)...")
        new_listing_payload = {
            "seller_id": rajesh.id,
            "title": "Verified Red Clay Bricks for Secondary Masonry",
            "material": "Red Clay Bricks",
            "category": "construction",
            "quantity": 250.0,
            "unit": "pieces",
            "weight_kg": 625.0,
            "quantity_source": "manual",
            "quantity_verified": True,
            "confidence": 0.95,
            "condition": "good",
            "price": 2000.0,
            "is_free": False,
            "reuse_recommendation": data["reuse_recommendation"],
            "reuse_sources": data["reuse_sources"],
            "hazard_flag": False
        }
        res = client.post("/listings", json=new_listing_payload)
        assert res.status_code == 200, f"Create listing failed: {res.text}"
        listing = res.json()
        listing_id = listing["id"]
        print(f"  ✓ Created Listing #{listing_id}: '{listing['title']}' | Status: {listing['status']}")
        assert listing["quantity_verified"] is True
        assert listing["quantity_source"] == "manual"

        # ---------------------------------------------------------
        # TEST 3: Matching Agent Finds Buyers
        # ---------------------------------------------------------
        print(f"\n[Step 3] GET /matches/{listing_id}?language=en...")
        res = client.get(f"/matches/{listing_id}?language=en")
        assert res.status_code == 200
        m_data = res.json()
        print(f"  ✓ Has matches: {m_data['has_matches']}, Count: {len(m_data['matches'])}")
        assert m_data["has_matches"] is True, "Expected matches for Red Clay Bricks"
        for m in m_data["matches"]:
            print(f"    -> Buyer: {m['buyer_name']} ({m['city']}, {m['distance_km']} km) | Reason: {m['match_reason']}")

        # ---------------------------------------------------------
        # TEST 4: Fallback Agent on No-Match Listing
        # ---------------------------------------------------------
        print("\n[Step 4] Creating unique surplus item with no matching requests to test Fallback Agent...")
        nomatch_payload = {
            "seller_id": rajesh.id,
            "title": "Surplus Obsolete Transformer Cores & High-Voltage Copper Coils",
            "material": "HV Copper Transformer Cores",
            "category": "electronics",
            "quantity": 12.0,
            "unit": "units",
            "weight_kg": 180.0,
            "condition": "fair",
            "price": 4500.0,
            "is_free": False
        }
        res_nm = client.post("/listings", json=nomatch_payload)
        nomatch_id = res_nm.json()["id"]

        res_fb = client.get(f"/matches/{nomatch_id}?language=hi")
        assert res_fb.status_code == 200
        fb_data = res_fb.json()
        print(f"  ✓ Has matches: {fb_data['has_matches']}, Fallbacks count: {len(fb_data['fallbacks'])}")
        assert fb_data["has_matches"] is False, "Expected no matches for rare item"
        assert len(fb_data["fallbacks"]) > 0, "Expected fallback recommendations"
        for fb in fb_data["fallbacks"]:
            print(f"    -> [{fb['type'].upper()}]: {fb['name']} ({fb.get('phone', 'DIY')})")

        # ---------------------------------------------------------
        # TEST 5: Offers & Negotiation Agent Ranking
        # ---------------------------------------------------------
        print(f"\n[Step 5] Buyer submits offers; Negotiation Agent ranks best offer...")
        # Suresh submits low offer
        res_o1 = client.post("/offers", json={
            "listing_id": listing_id,
            "buyer_id": suresh.id,
            "price": 1600.0,
            "message": "Can pickup this Sunday with mini truck."
        })
        assert res_o1.status_code == 200
        o1_id = res_o1.json()["id"]

        # Ananya submits better offer closer in distance
        res_o2 = client.post("/offers", json={
            "listing_id": listing_id,
            "buyer_id": ananya.id,
            "price": 1950.0,
            "message": "Urgent requirement for courtyard paving. Immediate pickup."
        })
        assert res_o2.status_code == 200
        o2_id = res_o2.json()["id"]

        # Fetch offers to inspect ranking
        res_offers = client.get(f"/offers/{listing_id}?language=en")
        offers = res_offers.json()
        print(f"  ✓ Ranked offers count: {len(offers)}")
        best_offer = next((o for o in offers if o["is_best_offer"]), None)
        assert best_offer is not None, "Expected a best offer"
        print(f"  ✓ Marked Best Offer: Offer #{best_offer['id']} by {best_offer['buyer_name']} (₹{best_offer['price']})")
        print(f"    Negotiation Reason: {best_offer['negotiation_reason']}")
        assert best_offer["buyer_id"] == ananya.id, "Ananya's offer of 1950 should be best offer"

        # ---------------------------------------------------------
        # TEST 6: Seller Accepts Offer -> Other Offers Auto-Declined
        # ---------------------------------------------------------
        print(f"\n[Step 6] POST /offers/{o2_id}/accept (Accepting Ananya's offer)...")
        res_acc = client.post(f"/offers/{o2_id}/accept")
        assert res_acc.status_code == 200
        acc_data = res_acc.json()
        print(f"  ✓ Accepted Offer #{acc_data['id']}: Status = {acc_data['status']}")
        assert acc_data["status"] == "accepted"

        # Verify listing advanced to accepted
        res_lst = client.get(f"/listings/{listing_id}")
        assert res_lst.status_code == 200
        assert res_lst.json()["status"] == "accepted"
        print(f"  ✓ Listing #{listing_id} status is now 'accepted'")

        # Verify Suresh's offer is now declined
        res_offers_after = client.get(f"/offers/{listing_id}")
        offers_after = {o["id"]: o["status"] for o in res_offers_after.json()}
        print(f"  ✓ Offer statuses: {offers_after}")
        assert offers_after[o2_id] == "accepted"
        assert offers_after[o1_id] == "declined"

        # ---------------------------------------------------------
        # TEST 7: Offline Payment & Pickup Scheduling (Address Reveal Check)
        # ---------------------------------------------------------
        print(f"\n[Step 7] POST /listings/{listing_id}/pickup...")
        res_pickup = client.post(f"/listings/{listing_id}/pickup", json={
            "pickup_date": "2026-11-12",
            "pickup_window": "09:00 AM - 12:00 PM",
            "pickup_note": "Loading dock on south side, assistance provided."
        })
        assert res_pickup.status_code == 200
        p_data = res_pickup.json()
        print(f"  ✓ Pickup arranged: {p_data['pickup_date']} ({p_data['pickup_window']})")
        print(f"  ✓ Status: {p_data['status']}")
        assert p_data["status"] == "pickup_arranged"

        # ---------------------------------------------------------
        # TEST 8: Separate Confirmations & Impact Agent Update
        # ---------------------------------------------------------
        print(f"\n[Step 8] Testing separate buyer & seller confirmations...")
        # Step 8a: Seller confirms
        res_sc = client.post(f"/listings/{listing_id}/confirm", json={"role": "seller"})
        assert res_sc.status_code == 200
        assert res_sc.json()["status"] == "pickup_arranged"
        assert res_sc.json()["seller_confirmed"] is True
        assert res_sc.json()["buyer_confirmed"] is False
        print("  ✓ Seller confirmed. Listing status correctly remains 'pickup_arranged'.")

        # Step 8b: Buyer confirms
        res_bc = client.post(f"/listings/{listing_id}/confirm", json={"role": "buyer"})
        assert res_bc.status_code == 200
        assert res_bc.json()["status"] == "completed"
        assert res_bc.json()["buyer_confirmed"] is True
        print("  ✓ Buyer confirmed. Listing status changed to 'completed'!")

        # Step 8c: Verify Impact record created
        db.commit()  # Reset MySQL transaction snapshot to see newly committed row
        impact = db.query(Impact).filter(Impact.listing_id == listing_id).first()
        assert impact is not None, "Impact record must be created upon dual confirmation"
        print(f"  ✓ Impact calculated: {impact.kg_diverted} kg diverted, {impact.co2_saved} kg CO2 saved, ₹{impact.money_saved} saved")
        assert impact.is_estimated is False, "Quantity was verified, so is_estimated must be False"
        assert impact.kg_diverted > 0
        assert impact.co2_saved > 0

        # ---------------------------------------------------------
        # TEST 9: Dispute Workflow - Problem Report & Admin Resolution
        # ---------------------------------------------------------
        print(f"\n[Step 9] Testing Dispute Workflow: Report Problem & Admin Resolution...")
        # Create another listing and advance to pickup_arranged
        disp_listing = Listing(
            seller_id=rajesh.id,
            title="Secondhand Teak Door Frames",
            material="Teak Wood",
            category="wood",
            quantity=4.0,
            unit="pieces",
            condition="fair",
            price=3200.0,
            status="pickup_arranged",
            seller_confirmed=True
        )
        db.add(disp_listing)
        db.commit()
        db.refresh(disp_listing)

        # Buyer reports problem
        res_prob = client.post(f"/listings/{disp_listing.id}/report-problem", json={
            "role": "buyer",
            "reason": "not_as_described",
            "note": "Wood has deep structural termite rot on bottom side not visible in photos."
        })
        assert res_prob.status_code == 200
        assert res_prob.json()["status"] == "disputed"
        print(f"  ✓ Problem reported. Listing #{disp_listing.id} status is now 'disputed'.")

        # Admin fetches disputes
        res_disputes = client.get("/admin/disputes")
        assert res_disputes.status_code == 200
        disputes_list = res_disputes.json()
        assert any(d["id"] == disp_listing.id for d in disputes_list)
        print(f"  ✓ Admin sees {len(disputes_list)} active disputes in dashboard.")

        # Admin resolves dispute with 'cancel'
        res_res = client.post(f"/admin/disputes/{disp_listing.id}/resolve", json={
            "action": "cancel",
            "admin_note": "Termite rot verified on inspect. Material unsafe for structural reuse. Deal cancelled."
        })
        assert res_res.status_code == 200
        assert res_res.json()["status"] == "listed"
        # Confirm no impact record exists for cancelled dispute
        db.commit()
        disp_impact = db.query(Impact).filter(Impact.listing_id == disp_listing.id).first()
        assert disp_impact is None, "Cancelled dispute must not create an impact record"
        print("  ✓ Admin resolved dispute with 'cancel' (Exchange cancelled, listing restored, no impact awarded).")

        # ---------------------------------------------------------
        # TEST 10: Simulated 48-Hour SLA Timeout
        # ---------------------------------------------------------
        print(f"\n[Step 10] Testing Simulated 48-Hour SLA Timeout...")
        timeout_listing = Listing(
            seller_id=rajesh.id,
            title="Surplus River Sand (Washed)",
            material="Sand",
            category="construction",
            quantity=2.0,
            unit="tons",
            condition="good",
            price=4000.0,
            status="pickup_arranged",
            seller_confirmed=True,
            buyer_confirmed=False
        )
        db.add(timeout_listing)
        db.commit()
        db.refresh(timeout_listing)

        res_sim = client.post(f"/admin/simulate-timeout/{timeout_listing.id}")
        assert res_sim.status_code == 200
        assert res_sim.json()["status"] == "disputed"
        print(f"  ✓ Simulated timeout triggered! Listing #{timeout_listing.id} moved to 'disputed' for mediation.")

        # ---------------------------------------------------------
        # TEST 11: Multi-Language Switcher (en / te / hi)
        # ---------------------------------------------------------
        print(f"\n[Step 11] Testing PATCH /users/{rajesh.id}/language...")
        for lang in ["hi", "te", "en"]:
            res_lang = client.patch(f"/users/{rajesh.id}/language", json={"preferred_language": lang})
            assert res_lang.status_code == 200
            assert res_lang.json()["preferred_language"] == lang
            print(f"  ✓ Rajesh's preferred language updated to '{lang}'")

        # ---------------------------------------------------------
        # TEST 12: Environmental Impact Analytics & Reuse Certificate Data
        # ---------------------------------------------------------
        print(f"\n[Step 12] GET /impact/{rajesh.id} (Cumulative platform & user impact)...")
        res_imp = client.get(f"/impact/{rajesh.id}")
        assert res_imp.status_code == 200
        imp_data = res_imp.json()
        print(f"  ✓ User Total kg Diverted: {imp_data['total_kg_diverted']} kg")
        print(f"  ✓ User Total CO2 Saved: {imp_data['total_co2_saved']} kg")
        print(f"  ✓ User Total Money Saved: ₹{imp_data['total_money_saved']}")
        print(f"  ✓ User Items Reused: {imp_data['items_reused']}")
        print(f"  ✓ Confirmed Metrics: {imp_data['confirmed_metrics']}")
        print(f"  ✓ Estimated Metrics: {imp_data['estimated_metrics']}")
        print(f"  ✓ Exchange History Count: {len(imp_data['history'])}")
        print(f"  ✓ Confirmed vs Estimated separation present: {bool(imp_data['confirmed_metrics'] and imp_data['estimated_metrics'])}")

        print("\n" + "=" * 70)
        print("ALL 12 END-TO-END INTEGRATION TEST SCENARIOS PASSED WITH ZERO ERRORS!")
        print("=" * 70)

    finally:
        db.close()

if __name__ == "__main__":
    test_full_pipeline()
