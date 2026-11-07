import os
from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from db import get_db
from models import Listing, User, Notification, ExchangeEvent, Offer
from schemas import ListingResponse, ListingDisputeResolveRequest
from agents.impact_agent import run_impact_agent

router = APIRouter(prefix="/admin", tags=["Admin Disputes"])

@router.get("/disputes", response_model=List[ListingResponse])
def get_all_disputes(db: Session = Depends(get_db)):
    """
    Administrator endpoint: lists all disputed exchanges awaiting mediation.
    Shows seller & buyer confirmations, dispute reasons, and notes.
    """
    disputed = db.query(Listing).filter(Listing.status == "disputed").order_by(desc(Listing.disputed_at)).all()
    for item in disputed:
        if item.seller:
            item.seller_name = item.seller.name
            item.seller_city = item.seller.city
    return disputed

@router.post("/disputes/{listing_id}/resolve", response_model=ListingResponse)
def resolve_dispute(
    listing_id: int,
    payload: ListingDisputeResolveRequest,
    db: Session = Depends(get_db)
):
    """
    Administrator mediation decision:
    (a) 'complete': marks completed, calculates environmental impact.
    (b) 'cancel': returns listing to 'listed', clears offer, no impact.
    (c) 'reject': rejects the dispute report, returns status to 'pickup_arranged'.
    """
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    if listing.status != "disputed":
        raise HTTPException(status_code=400, detail=f"Listing is not in disputed status (current: {listing.status})")

    now = datetime.utcnow()
    listing.admin_note = payload.admin_note
    listing.resolved_at = now

    action = payload.action.lower().strip()
    if action == "complete":
        listing.status = "completed"
        listing.seller_confirmed = True
        listing.buyer_confirmed = True
        listing.completed_at = now
        # Run impact agent
        impact_rec, trace = run_impact_agent(listing, db)
        event_name = "ADMIN_RESOLVED:COMPLETED"

    elif action == "cancel":
        listing.status = "listed"
        listing.seller_confirmed = False
        listing.buyer_confirmed = False
        # Revoke accepted offer
        accepted_offer = db.query(Offer).filter(
            Offer.listing_id == listing.id,
            Offer.status == "accepted"
        ).first()
        if accepted_offer:
            accepted_offer.status = "declined"
        event_name = "ADMIN_RESOLVED:CANCELLED"

    elif action == "reject":
        listing.status = "pickup_arranged"
        event_name = "ADMIN_RESOLVED:REJECTED_REPORT"

    else:
        raise HTTPException(status_code=400, detail="Action must be one of: 'complete', 'cancel', 'reject'")

    # Notify parties
    seller_notif = Notification(
        user_id=listing.seller_id,
        type="dispute_resolved",
        message_key="notif.dispute_resolved",
        params={
            "listing_title": listing.title,
            "decision": action,
            "admin_note": payload.admin_note or ""
        }
    )
    db.add(seller_notif)

    event = ExchangeEvent(
        listing_id=listing.id,
        actor_id=None,
        event=event_name
    )
    db.add(event)

    db.commit()
    db.refresh(listing)
    return listing

@router.post("/simulate-timeout/{listing_id}", response_model=ListingResponse)
def simulate_timeout(listing_id: int, db: Session = Depends(get_db)):
    """
    Demo endpoint: simulates the 48-hour timeout conflict condition.
    When one party has confirmed and the other has not responded for 48 hours,
    automatically transitions the exchange into 'disputed' for Administrator review.
    """
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # If neither party has confirmed yet, simulate seller confirmation first
    if not listing.seller_confirmed and not listing.buyer_confirmed:
        listing.seller_confirmed = True

    # Simulate 48-hour timeout
    simulated_past = datetime.utcnow() - timedelta(hours=49)
    listing.last_confirmation_at = simulated_past
    listing.status = "disputed"
    listing.dispute_reason = "other"
    listing.dispute_note = "Automated 48-hour non-response timeout triggered: Buyer did not confirm within the 48-hour SLA window."
    listing.disputed_at = datetime.utcnow()

    event = ExchangeEvent(
        listing_id=listing.id,
        actor_id=None,
        event="TIMEOUT_48H_TRIGGERED"
    )
    db.add(event)

    db.commit()
    db.refresh(listing)
    return listing
