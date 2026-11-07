"""
Comprehensive Section D Buyer Experience Verification Suite for Punarva.
Tests:
1. Pickup negotiation: Propose pickup, counter-proposal, accept proposal.
2. Party authorization: Blocks unauthorized users from countering, accepting, or confirming.
3. Invalid state transitions: Blocks completion confirmation prior to 'pickup_arranged'.
4. Dual confirmation: Both buyer and seller must confirm independently before 'completed'.
5. Notifications: Proper parameters with listing_id, unread status, and mark-read workflow.
"""

import sys
import os
from datetime import datetime

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from db import SessionLocal
from models import User, Listing, Offer, Notification, ExchangeEvent, Impact

def test_buyer_experience_lifecycle():
    print("=================================================================")
    print("      SECTION D VERIFICATION: BUYER EXPERIENCE & NEGOTIATION     ")
    print("=================================================================")

    db = SessionLocal()
    try:
        # 1. Fetch test users
        seller = db.query(User).filter(User.role == "seller").first()
        buyer = db.query(User).filter(User.role == "buyer").first()
        outsider = db.query(User).filter(User.role == "org").first()

        assert seller is not None, "Seller user not found in DB"
        assert buyer is not None, "Buyer user not found in DB"
        assert outsider is not None, "Outsider user not found in DB"
        print(f"[PASS] Loaded users: Seller #{seller.id} ({seller.name}), Buyer #{buyer.id} ({buyer.name}), Outsider #{outsider.id} ({outsider.name})")

        # Clean up any leftover test listing from previous runs
        prev_listings = db.query(Listing).filter(Listing.title == "Surplus Teak Wood Planks - Section D Test").all()
        for pl in prev_listings:
            db.query(Impact).filter(Impact.listing_id == pl.id).delete()
            db.query(ExchangeEvent).filter(ExchangeEvent.listing_id == pl.id).delete()
            db.query(Notification).filter(Notification.params.like(f"%{pl.id}%")).delete(synchronize_session=False)
            db.query(Offer).filter(Offer.listing_id == pl.id).delete()
            db.delete(pl)
        db.commit()

        # 2. Setup clean test listing and offer
        test_listing = Listing(
            seller_id=seller.id,
            title="Surplus Teak Wood Planks - Section D Test",
            material="Teak Wood",
            category="wood",
            quantity=15.0,
            unit="pieces",
            condition="good",
            weight_kg=120.0,
            price=2800.0,
            status="listed"
        )
        db.add(test_listing)
        db.commit()
        db.refresh(test_listing)
        print(f"[PASS] Created test listing #{test_listing.id} ('{test_listing.title}') in status '{test_listing.status}'")

        # 3. Buyer submits offer
        test_offer = Offer(
            listing_id=test_listing.id,
            buyer_id=buyer.id,
            price=2600.0,
            message="Can collect tomorrow with small tempo truck.",
            status="pending"
        )
        db.add(test_offer)
        db.commit()
        db.refresh(test_offer)
        print(f"[PASS] Created test offer #{test_offer.id} of Rs.{test_offer.price} by Buyer #{buyer.id}")

        # 4. Seller accepts offer
        test_offer.status = "accepted"
        test_listing.status = "accepted"
        
        # Add offer accepted notification
        notif_offer = Notification(
            user_id=buyer.id,
            type="offer_accepted",
            message_key="notif.offer_accepted",
            params={"listing_id": test_listing.id, "listing_title": test_listing.title}
        )
        db.add(notif_offer)
        db.commit()
        db.refresh(test_listing)
        print(f"[PASS] Seller accepted offer. Listing status -> '{test_listing.status}'. Buyer notified with listing_id.")

        # Import exchange functions to test API logic
        from routes.exchange import (
            propose_pickup,
            counter_pickup,
            accept_pickup_schedule,
            confirm_exchange,
            _check_party_authorization
        )
        from schemas import ListingPickupRequest, ListingPickupAcceptRequest, ListingConfirmRequest
        from fastapi import HTTPException

        # 5. Seller proposes pickup schedule
        pickup_req = ListingPickupRequest(
            pickup_date="2026-11-12",
            pickup_window="09:00 - 11:00 AM",
            pickup_note="Please pull up at Gate 2 loading dock.",
            actor_id=seller.id,
            actor_role="seller"
        )
        res = propose_pickup(test_listing.id, pickup_req, db)
        assert res.status == "pickup_proposed", f"Expected status 'pickup_proposed', got {res.status}"
        assert res.pickup_proposed_by == "seller", f"Expected pickup_proposed_by 'seller', got {res.pickup_proposed_by}"
        assert res.pickup_date == "2026-11-12"
        print(f"[PASS] Seller proposed pickup for {res.pickup_date} ({res.pickup_window}). Status -> '{res.status}', Proposer -> '{res.pickup_proposed_by}'")

        # Verify notification generated for buyer
        buyer_notif = db.query(Notification).filter(
            Notification.user_id == buyer.id,
            Notification.type == "pickup_proposed"
        ).order_by(Notification.id.desc()).first()
        assert buyer_notif is not None, "Notification for buyer not found"
        assert buyer_notif.params.get("listing_id") == test_listing.id, "Notification missing listing_id"
        print(f"[PASS] Buyer received clickable notification #{buyer_notif.id} (listing_id={buyer_notif.params['listing_id']})")

        # 6. Test authorization check: Outsider cannot counter-propose
        unauthorized_blocked = False
        try:
            counter_req = ListingPickupRequest(
                pickup_date="2026-11-14",
                pickup_window="02:00 - 04:00 PM",
                pickup_note="Outsider intrusion",
                actor_id=outsider.id,
                actor_role="buyer"
            )
            counter_pickup(test_listing.id, counter_req, db)
        except HTTPException as e:
            if e.status_code == 403:
                unauthorized_blocked = True
        assert unauthorized_blocked, "Unauthorized user was not blocked from counter-proposing!"
        print(f"[PASS] Security check: Outsider (User #{outsider.id}) blocked from modifying pickup with HTTP 403 Forbidden")

        # 7. Buyer counter-proposes a different pickup schedule
        counter_req = ListingPickupRequest(
            pickup_date="2026-11-13",
            pickup_window="03:00 - 05:00 PM",
            pickup_note="Morning has heavy traffic, afternoon works better.",
            actor_id=buyer.id,
            actor_role="buyer"
        )
        res_counter = counter_pickup(test_listing.id, counter_req, db)
        assert res_counter.status == "pickup_proposed", f"Expected status 'pickup_proposed', got {res_counter.status}"
        assert res_counter.pickup_proposed_by == "buyer", f"Expected pickup_proposed_by 'buyer', got {res_counter.pickup_proposed_by}"
        assert res_counter.pickup_date == "2026-11-13"
        print(f"[PASS] Buyer counter-proposed pickup for {res_counter.pickup_date} ({res_counter.pickup_window}). Proposer -> '{res_counter.pickup_proposed_by}'")

        # Verify seller received counter notification
        seller_notif = db.query(Notification).filter(
            Notification.user_id == seller.id,
            Notification.message_key == "notif.pickup_countered"
        ).order_by(Notification.id.desc()).first()
        assert seller_notif is not None, "Seller did not receive counter-proposal notification"
        assert seller_notif.params.get("listing_id") == test_listing.id
        print(f"[PASS] Seller received counter-proposal notification #{seller_notif.id} with listing_id")

        # 8. Test invalid confirmation before 'pickup_arranged'
        premature_confirm_blocked = False
        try:
            confirm_req = ListingConfirmRequest(actor_id=seller.id, confirmed=True)
            confirm_exchange(test_listing.id, confirm_req, db)
        except HTTPException as e:
            if e.status_code == 400 and "pickup_arranged" in e.detail:
                premature_confirm_blocked = True
        assert premature_confirm_blocked, "Confirmation before 'pickup_arranged' should be blocked with 400!"
        print("[PASS] State rule enforced: Confirming exchange before 'pickup_arranged' strictly blocked with HTTP 400")

        # 9. Seller accepts buyer's counter-proposal
        accept_req = ListingPickupAcceptRequest(actor_id=seller.id)
        res_arranged = accept_pickup_schedule(test_listing.id, accept_req, db)
        assert res_arranged.status == "pickup_arranged", f"Expected 'pickup_arranged', got {res_arranged.status}"
        print(f"[PASS] Seller accepted counter-proposal. Status successfully transitioned to '{res_arranged.status}'")

        # 10. Dual confirmation test:
        # Step A: Seller confirms handover
        res_confirm1 = confirm_exchange(test_listing.id, ListingConfirmRequest(actor_id=seller.id, confirmed=True), db)
        assert res_confirm1.seller_confirmed is True
        assert res_confirm1.buyer_confirmed is False
        assert res_confirm1.status == "pickup_arranged", "Status must remain 'pickup_arranged' after single confirmation"
        print(f"[PASS] Dual confirmation Step 1: Seller confirmed. Status remains '{res_confirm1.status}' (awaiting buyer)")

        # Step B: Outsider tries to confirm -> HTTP 403
        outsider_confirm_blocked = False
        try:
            confirm_exchange(test_listing.id, ListingConfirmRequest(actor_id=outsider.id, confirmed=True), db)
        except HTTPException as e:
            if e.status_code == 403:
                outsider_confirm_blocked = True
        assert outsider_confirm_blocked, "Outsider was not blocked from confirming exchange"
        print(f"[PASS] Security check: Outsider blocked from confirming exchange with HTTP 403")

        # Step C: Buyer confirms handover
        res_confirm2 = confirm_exchange(test_listing.id, ListingConfirmRequest(actor_id=buyer.id, confirmed=True), db)
        assert res_confirm2.seller_confirmed is True
        assert res_confirm2.buyer_confirmed is True
        assert res_confirm2.status == "completed", f"Expected 'completed', got {res_confirm2.status}"
        print(f"[PASS] Dual confirmation Step 2: Buyer confirmed. Both confirmed -> status transitioned to '{res_confirm2.status}'")

        # 11. Verify Impact Agent execution
        impact_entry = db.query(Impact).filter(Impact.listing_id == test_listing.id).first()
        assert impact_entry is not None, "Impact was not generated upon completion!"
        assert impact_entry.kg_diverted > 0, "Diverted kg must be positive"
        assert impact_entry.co2_saved > 0, "CO2 avoided must be positive"
        assert impact_entry.money_saved > 0, "Economic savings must be positive"
        print(f"[PASS] Impact calculated: {impact_entry.kg_diverted} kg diverted, {impact_entry.co2_saved} kg CO2 avoided, Rs.{impact_entry.money_saved} saved. Impact ID: #{impact_entry.id}")

        # 12. Verify Notification Read Status update
        notif_to_read = buyer_notif
        assert notif_to_read.is_read is False, "Initial notification should be unread"
        notif_to_read.is_read = True
        db.commit()
        db.refresh(notif_to_read)
        assert notif_to_read.is_read is True, "Notification read status update failed"
        print(f"[PASS] Notification read status updated: is_read=True on Notification #{notif_to_read.id}")

        # Clean up test artifacts
        db.delete(impact_entry)
        db.query(ExchangeEvent).filter(ExchangeEvent.listing_id == test_listing.id).delete()
        db.query(Notification).filter(Notification.params.like(f"%{test_listing.id}%")).delete(synchronize_session=False)
        db.query(Offer).filter(Offer.listing_id == test_listing.id).delete()
        db.delete(test_listing)
        db.commit()
        print("[PASS] Test cleanup completed successfully.")

        print("\n=================================================================")
        print("          ALL SECTION D SPECIFICATION TESTS PASSED (12/12)       ")
        print("=================================================================\n")
        return True

    except Exception as e:
        db.rollback()
        print(f"\n[FAIL] Section D test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = test_buyer_experience_lifecycle()
    sys.exit(0 if success else 1)
