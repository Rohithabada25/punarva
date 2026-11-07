import os
from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from db import get_db
from models import Offer, Listing, User, Notification, ExchangeEvent
from schemas import OfferCreate, OfferResponse
from agents.negotiation_agent import run_negotiation_agent

router = APIRouter(prefix="/offers", tags=["Offers"])

@router.post("", response_model=OfferResponse)
def submit_offer(payload: OfferCreate, db: Session = Depends(get_db)):
    """
    Submits a new offer on a listing.
    Enforces rule: exactly one active (pending) offer per listing per buyer.
    Notifies the seller.
    """
    listing = db.query(Listing).filter(Listing.id == payload.listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    if listing.seller_id == payload.buyer_id:
        raise HTTPException(status_code=400, detail="Cannot make an offer on your own listing")

    if listing.status not in ("listed", "offer_received"):
        raise HTTPException(status_code=400, detail=f"Listing is not currently accepting offers (status: {listing.status})")

    # Check for existing pending offer by this buyer
    existing = db.query(Offer).filter(
        Offer.listing_id == payload.listing_id,
        Offer.buyer_id == payload.buyer_id,
        Offer.status == "pending"
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You already have an active pending offer on this material. Withdraw it first to submit a new price.")

    offer = Offer(
        listing_id=payload.listing_id,
        buyer_id=payload.buyer_id,
        price=payload.price,
        message=payload.message,
        status="pending"
    )
    db.add(offer)

    # Update listing status if currently listed
    if listing.status == "listed":
        listing.status = "offer_received"

    # Notify seller
    buyer = db.query(User).filter(User.id == payload.buyer_id).first()
    buyer_name = buyer.name if buyer else "A buyer"
    notif = Notification(
        user_id=listing.seller_id,
        type="offer_received",
        message_key="notif.offer_received",
        params={
            "listing_id": listing.id,
            "buyer_name": buyer_name,
            "listing_title": listing.title,
            "amount": payload.price
        }
    )
    db.add(notif)

    # Event log
    event = ExchangeEvent(
        listing_id=listing.id,
        actor_id=payload.buyer_id,
        event="OFFER_SUBMITTED"
    )
    db.add(event)

    db.commit()
    db.refresh(offer)

    offer.buyer_name = buyer_name
    offer.buyer_city = buyer.city if buyer else "Local"
    return offer

@router.get("/{listing_id}", response_model=List[OfferResponse])
def get_listing_offers(
    listing_id: int,
    language: str = Query("en"),
    db: Session = Depends(get_db)
):
    """
    Returns offers for a listing, ranked by Negotiation Agent.
    Highlights Best Offer with proximity and price analysis.
    """
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    offers = db.query(Offer).filter(Offer.listing_id == listing_id).order_by(desc(Offer.created_at)).all()
    if not offers:
        return []

    ranked, trace = run_negotiation_agent(listing, offers, language=language)
    return ranked

@router.post("/{offer_id}/withdraw", response_model=OfferResponse)
def withdraw_offer(offer_id: int, db: Session = Depends(get_db)):
    """Buyer withdraws their pending offer before seller acceptance."""
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    if offer.status != "pending":
        raise HTTPException(status_code=400, detail=f"Cannot withdraw offer in '{offer.status}' status")

    offer.status = "withdrawn"

    # Check if there are other pending offers on the listing
    listing = db.query(Listing).filter(Listing.id == offer.listing_id).first()
    if listing and listing.status == "offer_received":
        other_pending = db.query(Offer).filter(
            Offer.listing_id == listing.id,
            Offer.status == "pending"
        ).count()
        if other_pending == 0:
            listing.status = "listed"

    # Event
    event = ExchangeEvent(
        listing_id=offer.listing_id,
        actor_id=offer.buyer_id,
        event="OFFER_WITHDRAWN"
    )
    db.add(event)
    db.commit()
    db.refresh(offer)
    return offer

@router.post("/{offer_id}/accept", response_model=OfferResponse)
def accept_offer(offer_id: int, db: Session = Depends(get_db)):
    """
    Seller accepts an offer.
    1. Offer status becomes 'accepted'.
    2. Listing status advances to 'accepted'.
    3. All other pending offers on this listing are marked 'declined'.
    4. Declined buyers are notified.
    5. Accepted buyer is notified to arrange offline pickup.
    """
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    listing = db.query(Listing).filter(Listing.id == offer.listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # Mark offer accepted
    offer.status = "accepted"
    listing.status = "accepted"

    # Decline all other pending offers on this listing
    other_offers = db.query(Offer).filter(
        Offer.listing_id == listing.id,
        Offer.id != offer.id,
        Offer.status == "pending"
    ).all()

    for other in other_offers:
        other.status = "declined"
        notif_declined = Notification(
            user_id=other.buyer_id,
            type="offer_declined",
            message_key="notif.offer_declined",
            params={
                "listing_id": listing.id,
                "listing_title": listing.title
            }
        )
        db.add(notif_declined)

    # Notify accepted buyer
    notif_accepted = Notification(
        user_id=offer.buyer_id,
        type="offer_accepted",
        message_key="notif.offer_accepted",
        params={
            "listing_id": listing.id,
            "listing_title": listing.title,
            "seller_name": listing.seller.name if listing.seller else "Seller",
            "amount": offer.price
        }
    )
    db.add(notif_accepted)

    # Audit log
    event = ExchangeEvent(
        listing_id=listing.id,
        actor_id=listing.seller_id,
        event="OFFER_ACCEPTED"
    )
    db.add(event)

    db.commit()
    db.refresh(offer)
    return offer

@router.post("/{offer_id}/reject", response_model=OfferResponse)
def reject_offer(offer_id: int, db: Session = Depends(get_db)):
    """Seller rejects an offer. Listing remains 'listed' or open for others."""
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    offer.status = "declined"

    listing = db.query(Listing).filter(Listing.id == offer.listing_id).first()
    if listing:
        pending_count = db.query(Offer).filter(
            Offer.listing_id == listing.id,
            Offer.status == "pending"
        ).count()
        if pending_count == 0 and listing.status == "offer_received":
            listing.status = "listed"

    # Notify buyer
    notif = Notification(
        user_id=offer.buyer_id,
        type="offer_declined",
        message_key="notif.offer_declined",
        params={"listing_title": listing.title if listing else "Material"}
    )
    db.add(notif)

    # Event
    event = ExchangeEvent(
        listing_id=offer.listing_id,
        actor_id=listing.seller_id if listing else None,
        event="OFFER_REJECTED"
    )
    db.add(event)

    db.commit()
    db.refresh(offer)
    return offer
