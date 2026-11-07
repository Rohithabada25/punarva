import os
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from db import get_db
from models import Listing, User, Notification, ExchangeEvent, Offer
from schemas import (
    ListingPickupRequest, ListingPickupAcceptRequest,
    ListingConfirmRequest, ListingDisputeRequest, ListingResponse
)
from agents.impact_agent import run_impact_agent

router = APIRouter(prefix="/listings", tags=["Exchange & Settlement"])

def _get_accepted_offer(listing_id: int, db: Session):
    return db.query(Offer).filter(
        Offer.listing_id == listing_id,
        Offer.status == "accepted"
    ).first()

def _check_party_authorization(listing: Listing, actor_id: int, db: Session):
    accepted_offer = _get_accepted_offer(listing.id, db)
    allowed_ids = {listing.seller_id}
    if accepted_offer:
        allowed_ids.add(accepted_offer.buyer_id)
    if actor_id not in allowed_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to modify negotiations for this listing."
        )

@router.post("/{listing_id}/pickup", response_model=ListingResponse)
def propose_pickup(
    listing_id: int,
    payload: ListingPickupRequest,
    db: Session = Depends(get_db)
):
    """
    Offline payment and pickup schedule proposal.
    Typically initiated by seller after accepting an offer.
    Status moves to 'pickup_proposed'.
    """
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    if listing.status not in ("accepted", "pickup_proposed"):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot propose pickup for listing in '{listing.status}' status. Must be 'accepted' or 'pickup_proposed'."
        )

    if payload.actor_id:
        _check_party_authorization(listing, payload.actor_id, db)

    proposer_role = payload.actor_role or "seller"
    listing.pickup_date = payload.pickup_date
    listing.pickup_window = payload.pickup_window
    listing.pickup_note = payload.pickup_note
    listing.pickup_proposed_by = proposer_role
    listing.status = "pickup_proposed"

    accepted_offer = _get_accepted_offer(listing.id, db)
    if accepted_offer:
        # Notify the other party
        recipient_id = accepted_offer.buyer_id if proposer_role == "seller" else listing.seller_id
        notif = Notification(
            user_id=recipient_id,
            type="pickup_proposed",
            message_key="notif.pickup_proposed",
            params={
                "listing_id": listing.id,
                "listing_title": listing.title,
                "date": payload.pickup_date,
                "window": payload.pickup_window
            }
        )
        db.add(notif)

    event = ExchangeEvent(
        listing_id=listing.id,
        actor_id=payload.actor_id or (listing.seller_id if proposer_role == "seller" else (accepted_offer.buyer_id if accepted_offer else None)),
        event="PICKUP_PROPOSED"
    )
    db.add(event)

    db.commit()
    db.refresh(listing)
    return listing

@router.post("/{listing_id}/pickup/counter", response_model=ListingResponse)
def counter_pickup(
    listing_id: int,
    payload: ListingPickupRequest,
    db: Session = Depends(get_db)
):
    """
    Counter-proposal for pickup schedule (e.g. buyer suggesting a different date/window).
    Listing remains in 'pickup_proposed' with updated proposer role.
    """
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    if listing.status not in ("accepted", "pickup_proposed"):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot counter pickup for listing in '{listing.status}' status."
        )

    if payload.actor_id:
        _check_party_authorization(listing, payload.actor_id, db)

    proposer_role = payload.actor_role or "buyer"
    listing.pickup_date = payload.pickup_date
    listing.pickup_window = payload.pickup_window
    listing.pickup_note = payload.pickup_note
    listing.pickup_proposed_by = proposer_role
    listing.status = "pickup_proposed"

    accepted_offer = _get_accepted_offer(listing.id, db)
    if accepted_offer:
        recipient_id = listing.seller_id if proposer_role == "buyer" else accepted_offer.buyer_id
        notif = Notification(
            user_id=recipient_id,
            type="pickup_proposed",
            message_key="notif.pickup_countered",
            params={
                "listing_id": listing.id,
                "listing_title": listing.title,
                "date": payload.pickup_date,
                "window": payload.pickup_window
            }
        )
        db.add(notif)

    event = ExchangeEvent(
        listing_id=listing.id,
        actor_id=payload.actor_id or (accepted_offer.buyer_id if proposer_role == "buyer" and accepted_offer else listing.seller_id),
        event="PICKUP_COUNTER_PROPOSED"
    )
    db.add(event)

    db.commit()
    db.refresh(listing)
    return listing

@router.post("/{listing_id}/pickup/accept", response_model=ListingResponse)
def accept_pickup_schedule(
    listing_id: int,
    payload: ListingPickupAcceptRequest = None,
    db: Session = Depends(get_db)
):
    """
    Accepts the proposed pickup schedule.
    Transitions listing status to 'pickup_arranged'.
    Both parties can now proceed with physical offline handover.
    """
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    if listing.status != "pickup_proposed":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot accept pickup schedule for listing in '{listing.status}' status. Must be 'pickup_proposed'."
        )

    actor_id = payload.actor_id if payload else None
    if actor_id:
        _check_party_authorization(listing, actor_id, db)

    listing.status = "pickup_arranged"

    accepted_offer = _get_accepted_offer(listing.id, db)
    if accepted_offer:
        # Notify both parties
        for uid in (listing.seller_id, accepted_offer.buyer_id):
            notif = Notification(
                user_id=uid,
                type="pickup_arranged",
                message_key="notif.pickup_arranged",
                params={
                    "listing_id": listing.id,
                    "listing_title": listing.title,
                    "date": listing.pickup_date or "Scheduled",
                    "window": listing.pickup_window or "Agreed Window"
                }
            )
            db.add(notif)

    event = ExchangeEvent(
        listing_id=listing.id,
        actor_id=actor_id or (accepted_offer.buyer_id if accepted_offer else listing.seller_id),
        event="PICKUP_SCHEDULE_AGREED"
    )
    db.add(event)

    db.commit()
    db.refresh(listing)
    return listing

@router.post("/{listing_id}/confirm", response_model=ListingResponse)
def confirm_exchange(
    listing_id: int,
    payload: ListingConfirmRequest,
    db: Session = Depends(get_db)
):
    """
    Separate buyer and seller confirmation endpoint.
    Completion confirmation is strictly available ONLY after 'pickup_arranged'.
    Exchange is completed ONLY when BOTH parties have confirmed.
    When both confirmed -> status becomes 'completed', Impact Agent executes.
    """
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    if listing.status != "pickup_arranged":
        raise HTTPException(
            status_code=400,
            detail=f"Completion confirmation is only available after 'pickup_arranged' status. Current status is '{listing.status}'."
        )

    now = datetime.utcnow()
    listing.last_confirmation_at = now

    accepted_offer = _get_accepted_offer(listing.id, db)

    # Validate authorization and resolve actor role
    if payload.actor_id:
        _check_party_authorization(listing, payload.actor_id, db)
        if payload.actor_id == listing.seller_id:
            resolved_role = "seller"
        elif accepted_offer and payload.actor_id == accepted_offer.buyer_id:
            resolved_role = "buyer"
        else:
            resolved_role = payload.role
    else:
        resolved_role = payload.role

    if resolved_role == "seller":
        if listing.seller_confirmed:
            return listing
        listing.seller_confirmed = True
        actor_id = listing.seller_id
        event_name = "SELLER_CONFIRMED"
    elif resolved_role == "buyer":
        if listing.buyer_confirmed:
            return listing
        listing.buyer_confirmed = True
        actor_id = accepted_offer.buyer_id if accepted_offer else None
        event_name = "BUYER_CONFIRMED"
    else:
        raise HTTPException(status_code=400, detail="Role must be either 'seller' or 'buyer'")

    db.add(ExchangeEvent(listing_id=listing.id, actor_id=actor_id, event=event_name))

    # Check if BOTH have confirmed
    if listing.seller_confirmed and listing.buyer_confirmed:
        listing.status = "completed"
        listing.completed_at = now

        # Run Impact Agent (deterministic calculation)
        impact_record, impact_trace = run_impact_agent(listing, db)

        # Notify both parties of successful exchange & environmental impact
        seller_notif = Notification(
            user_id=listing.seller_id,
            type="exchange_completed",
            message_key="notif.exchange_completed",
            params={
                "listing_title": listing.title,
                "kg_diverted": impact_record.kg_diverted,
                "co2_saved": impact_record.co2_saved
            }
        )
        db.add(seller_notif)

        if accepted_offer:
            buyer_notif = Notification(
                user_id=accepted_offer.buyer_id,
                type="exchange_completed",
                message_key="notif.exchange_completed",
                params={
                    "listing_title": listing.title,
                    "kg_diverted": impact_record.kg_diverted,
                    "co2_saved": impact_record.co2_saved
                }
            )
            db.add(buyer_notif)

    db.commit()
    db.refresh(listing)
    return listing

@router.post("/{listing_id}/report-problem", response_model=ListingResponse)
def report_problem(
    listing_id: int,
    payload: ListingDisputeRequest,
    db: Session = Depends(get_db)
):
    """
    Raises a dispute on an exchange (wrong quantity, no-show, not as described, other).
    Listing enters 'disputed' status and is routed to Administrator review.
    No impact is recorded while disputed.
    """
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    valid_reasons = ("wrong_quantity", "no_show", "not_as_described", "other")
    if payload.reason not in valid_reasons:
        raise HTTPException(status_code=400, detail=f"Dispute reason must be one of: {valid_reasons}")

    listing.status = "disputed"
    listing.dispute_reason = payload.reason
    listing.dispute_note = payload.note
    listing.disputed_at = datetime.utcnow()

    # Find admin user to notify
    admin = db.query(User).filter(User.role == "admin").first()
    if admin:
        admin_notif = Notification(
            user_id=admin.id,
            type="dispute_reported",
            message_key="notif.dispute_reported",
            params={
                "listing_id": listing.id,
                "listing_title": listing.title,
                "reason": payload.reason
            }
        )
        db.add(admin_notif)

    # Audit log
    event = ExchangeEvent(
        listing_id=listing.id,
        actor_id=listing.seller_id if payload.role == "seller" else None,
        event=f"DISPUTE_RAISED:{payload.reason.upper()}"
    )
    db.add(event)

    db.commit()
    db.refresh(listing)
    return listing
