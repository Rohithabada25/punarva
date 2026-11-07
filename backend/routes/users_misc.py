import os
from typing import List, Dict, Any, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from db import get_db
from models import User, Request, Notification, Listing, Impact, Offer
from schemas import (
    UserResponse, UserLanguageUpdate, UserUpdate,
    RequestCreate, RequestResponse,
    NotificationResponse, ImpactResponse
)
from auth import hash_password, verify_password

router = APIRouter(tags=["Users & Dashboard"])

@router.get("/users", response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    """Returns all seeded users for the demo user switcher (seller/buyer/org/admin)."""
    return db.query(User).all()

@router.get("/users/{user_id}", response_model=UserResponse)
def get_user_by_id(user_id: int, db: Session = Depends(get_db)):
    """Fetches user details by user ID."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.patch("/users/{user_id}", response_model=UserResponse)
def update_user_profile(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db)
):
    """
    Updates user profile information (name, city, role, language, coordinates, password).
    If changing password, validates current password if user has one set.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.name is not None:
        user.name = payload.name.strip()
    if payload.city is not None:
        user.city = payload.city.strip()
    if payload.role is not None:
        user.role = payload.role
    if payload.preferred_language is not None:
        user.preferred_language = payload.preferred_language
    if payload.lat is not None:
        user.lat = payload.lat
    if payload.lng is not None:
        user.lng = payload.lng

    # Password change
    if payload.new_password:
        if user.password_hash:
            if not payload.current_password:
                raise HTTPException(
                    status_code=400,
                    detail="Current password is required to set a new password."
                )
            if not verify_password(payload.current_password, user.password_hash):
                raise HTTPException(
                    status_code=400,
                    detail="Current password does not match."
                )
        user.password_hash = hash_password(payload.new_password)

    db.commit()
    db.refresh(user)
    return user

@router.patch("/users/{user_id}/language", response_model=UserResponse)
def update_user_language(
    user_id: int,
    payload: UserLanguageUpdate,
    db: Session = Depends(get_db)
):
    """Updates user's preferred language (en, te, hi). Remembers choice across sessions."""
    lang = payload.preferred_language.lower().strip()
    if lang not in ("en", "te", "hi"):
        raise HTTPException(status_code=400, detail="Supported languages are 'en', 'te', 'hi'")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.preferred_language = lang
    db.commit()
    db.refresh(user)
    return user

# Buyer Wanted Requests
@router.post("/requests", response_model=RequestResponse)
def create_wanted_request(payload: RequestCreate, db: Session = Depends(get_db)):
    """Creates a 'wanted' request from a buyer, contractor, or organization."""
    buyer = db.query(User).filter(User.id == payload.buyer_id).first()
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer user not found")

    req = Request(
        buyer_id=payload.buyer_id,
        material=payload.material,
        quantity=payload.quantity,
        budget=payload.budget,
        lat=payload.lat if payload.lat is not None else buyer.lat,
        lng=payload.lng if payload.lng is not None else buyer.lng,
        is_org=payload.is_org or (buyer.role == "org")
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    req.buyer_name = buyer.name
    return req

@router.get("/requests/{user_id}", response_model=List[RequestResponse])
def get_user_requests(user_id: int, db: Session = Depends(get_db)):
    """Lists wanted requests submitted by this user."""
    reqs = db.query(Request).filter(Request.buyer_id == user_id).order_by(desc(Request.created_at)).all()
    user = db.query(User).filter(User.id == user_id).first()
    for r in reqs:
        r.buyer_name = user.name if user else "Buyer"
    return reqs

# Notifications
@router.get("/notifications/{user_id}", response_model=List[NotificationResponse])
def get_user_notifications(user_id: int, db: Session = Depends(get_db)):
    """Fetches notifications for a user, stored with i18n translation keys and dynamic params."""
    return db.query(Notification).filter(Notification.user_id == user_id).order_by(desc(Notification.created_at)).all()

@router.post("/notifications/{notif_id}/read")
def mark_notification_read(notif_id: int, db: Session = Depends(get_db)):
    """Marks a single notification as read."""
    notif = db.query(Notification).filter(Notification.id == notif_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    return {"status": "ok", "id": notif.id}

# Impact Metrics
@router.get("/impact/{user_id}")
def get_user_impact(user_id: int, db: Session = Depends(get_db)):
    """
    Returns verified and estimated environmental impact metrics for a user or platform.
    Strictly excludes disputed and cancelled exchanges.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # If admin, show platform totals
    if user.role == "admin":
        impacts = db.query(Impact).join(Listing).filter(Listing.status == "completed").all()
    else:
        # User listings completed as seller OR buyer
        accepted_listings = db.query(Listing.id).join(Offer).filter(
            Offer.buyer_id == user_id,
            Offer.status == "accepted"
        ).scalar_subquery()

        impacts = db.query(Impact).join(Listing).filter(
            Listing.status == "completed",
            (Listing.seller_id == user_id) | (Listing.id.in_(accepted_listings))
        ).all()

    total_kg = sum(i.kg_diverted for i in impacts)
    total_co2 = sum(i.co2_saved for i in impacts)
    total_money = sum(i.money_saved for i in impacts)
    items_reused = len(impacts)

    confirmed_kg = sum(i.kg_diverted for i in impacts if not i.is_estimated)
    confirmed_co2 = sum(i.co2_saved for i in impacts if not i.is_estimated)
    estimated_kg = sum(i.kg_diverted for i in impacts if i.is_estimated)
    estimated_co2 = sum(i.co2_saved for i in impacts if i.is_estimated)

    details = []
    for i in impacts:
        details.append({
            "id": i.id,
            "listing_id": i.listing_id,
            "title": i.listing.title if i.listing else "Salvaged Material",
            "material": i.listing.material if i.listing else "Material",
            "kg_diverted": i.kg_diverted,
            "co2_saved": i.co2_saved,
            "money_saved": i.money_saved,
            "is_estimated": i.is_estimated,
            "completed_at": i.listing.completed_at if i.listing else i.created_at
        })

    return {
        "user_id": user.id,
        "user_name": user.name,
        "role": user.role,
        "items_reused": items_reused,
        "total_kg_diverted": round(total_kg, 1),
        "total_co2_saved": round(total_co2, 1),
        "total_money_saved": round(total_money, 2),
        "confirmed_metrics": {
            "kg_diverted": round(confirmed_kg, 1),
            "co2_saved": round(confirmed_co2, 1)
        },
        "estimated_metrics": {
            "kg_diverted": round(estimated_kg, 1),
            "co2_saved": round(estimated_co2, 1)
        },
        "history": details
    }

# Dashboard Summary
@router.get("/dashboard/{user_id}")
def get_user_dashboard(user_id: int, db: Session = Depends(get_db)):
    """
    Consolidated dashboard summary:
    - User profile & language
    - Quick counts (active listings, incoming offers, unread notifications)
    - Personal impact numbers
    - 'Recommended for you' listings with matching reasons
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    active_listings_count = db.query(Listing).filter(
        Listing.seller_id == user_id,
        Listing.status.in_(["listed", "offer_received", "accepted", "pickup_arranged"])
    ).count()

    unread_notifs_count = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False
    ).count()

    # New incoming offers for seller's listings
    seller_listing_ids = [l.id for l in db.query(Listing.id).filter(Listing.seller_id == user_id).all()]
    new_offers_count = db.query(Offer).filter(
        Offer.listing_id.in_(seller_listing_ids),
        Offer.status == "pending"
    ).count() if seller_listing_ids else 0

    # Impact summary
    user_impact = get_user_impact(user_id, db)

    # Recent notifications
    recent_notifs = db.query(Notification).filter(
        Notification.user_id == user_id
    ).order_by(desc(Notification.created_at)).limit(5).all()

    # Recommendations: Active listings matching user's requests or proximity
    recommended_listings = []
    user_reqs = db.query(Request).filter(Request.buyer_id == user_id).all()
    wanted_materials = [r.material.lower() for r in user_reqs]

    browse_listings = db.query(Listing).filter(
        Listing.seller_id != user_id,
        Listing.status.in_(["listed", "offer_received"])
    ).limit(6).all()

    for l in browse_listings:
        # Compute match reason
        match_reason = "Nearby material available for direct reuse"
        if any(w in l.material.lower() for w in wanted_materials):
            match_reason = f"Matches your wanted request for {l.material}!"
        elif l.is_free:
            match_reason = "Free community salvage donation"

        recommended_listings.append({
            "id": l.id,
            "title": l.title,
            "material": l.material,
            "category": l.category,
            "quantity": l.quantity,
            "unit": l.unit,
            "condition": l.condition,
            "price": l.price,
            "is_free": l.is_free,
            "image_url": l.image_url,
            "seller_city": l.seller.city if l.seller else "Bapatla",
            "match_reason": match_reason
        })

    return {
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "city": user.city,
            "preferred_language": user.preferred_language
        },
        "stats": {
            "active_listings": active_listings_count,
            "new_offers": new_offers_count,
            "unread_notifications": unread_notifs_count,
            "kg_diverted": user_impact["total_kg_diverted"],
            "co2_saved": user_impact["total_co2_saved"],
            "money_saved": user_impact["total_money_saved"]
        },
        "notifications": recent_notifs,
        "recommendations": recommended_listings
    }
