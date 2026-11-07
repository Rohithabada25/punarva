import os
import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from db import get_db
from models import Listing, User, Impact, Offer, ExchangeEvent, Notification
from schemas import (
    ListingCreate, ListingResponse, AnalysisResult,
    ListingPickupRequest, ListingConfirmRequest,
    ListingDisputeRequest, ListingDisputeResolveRequest
)
from graph import run_listing_analysis

router = APIRouter(prefix="/listings", tags=["Listings"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), os.getenv("UPLOAD_DIR", "uploads"))

@router.post("/analyze", response_model=AnalysisResult)
async def analyze_listing_image(
    file: UploadFile = File(...),
    language: str = Form("en")
):
    """
    Vision -> Reuse -> Pricing LangGraph agent pipeline.
    Accepts uploaded material image and returns probable material identification,
    RAG-backed reuse guidance with source citations, fair price recommendation,
    and agent execution trace.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be an image (JPEG, PNG, WebP)"
        )

    image_bytes = await file.read()
    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty image uploaded")

    # Run LangGraph pipeline
    analysis = run_listing_analysis(image_bytes=image_bytes, language=language)
    return analysis

@router.post("", response_model=ListingResponse)
def create_listing(
    payload: ListingCreate,
    db: Session = Depends(get_db)
):
    """Publishes a new material listing to the marketplace."""
    seller = db.query(User).filter(User.id == payload.seller_id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller user not found")

    new_listing = Listing(
        seller_id=payload.seller_id,
        title=payload.title,
        material=payload.material,
        category=payload.category,
        quantity=payload.quantity,
        unit=payload.unit,
        weight_kg=payload.weight_kg,
        quantity_source=payload.quantity_source,
        quantity_verified=payload.quantity_verified,
        confidence=payload.confidence,
        condition=payload.condition,
        price=0.0 if payload.is_free else payload.price,
        is_free=payload.is_free,
        status="listed",
        image_url=payload.image_url,
        reuse_recommendation=payload.reuse_recommendation,
        reuse_sources=payload.reuse_sources,
        hazard_flag=payload.hazard_flag,
        hazard_note=payload.hazard_note
    )

    db.add(new_listing)
    db.commit()
    db.refresh(new_listing)

    # Log exchange event
    event = ExchangeEvent(
        listing_id=new_listing.id,
        actor_id=payload.seller_id,
        event="LISTING_PUBLISHED"
    )
    db.add(event)
    db.commit()

    return new_listing

@router.get("", response_model=List[ListingResponse])
def get_all_listings(
    category: Optional[str] = None,
    condition: Optional[str] = None,
    status_filter: Optional[str] = None,
    seller_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Returns active listings with optional category and seller filtering."""
    query = db.query(Listing)
    if seller_id:
        query = query.filter(Listing.seller_id == seller_id)
    if status_filter:
        query = query.filter(Listing.status == status_filter)
    if category:
        query = query.filter(Listing.category == category)
    if condition:
        query = query.filter(Listing.condition == condition)

    listings = query.order_by(desc(Listing.created_at)).all()
    # Enrich with seller details
    for l in listings:
        if l.seller:
            l.seller_name = l.seller.name
            l.seller_city = l.seller.city
    return listings

@router.get("/search", response_model=List[ListingResponse])
def search_listings(
    material: Optional[str] = None,
    qty: Optional[float] = None,
    max_price: Optional[float] = None,
    radius_km: Optional[float] = None,
    condition: Optional[str] = None,
    free_only: Optional[bool] = False,
    user_lat: Optional[float] = 15.9042,
    user_lng: Optional[float] = 80.4674,
    db: Session = Depends(get_db)
):
    """
    Search materials with hard filters: budget, quantity, condition, free-only,
    and location radius (Haversine distance).
    """
    import math

    def haversine_km(lat1, lon1, lat2, lon2):
        R = 6371.0
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (math.sin(dlat / 2) ** 2 +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(dlon / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    query = db.query(Listing).filter(Listing.status.in_(["listed", "offer_received"]))

    if free_only:
        query = query.filter(Listing.is_free == True)
    elif max_price is not None:
        query = query.filter(Listing.price <= max_price)

    if condition:
        query = query.filter(Listing.condition == condition)

    if qty is not None:
        query = query.filter(Listing.quantity >= qty)

    if material:
        query = query.filter(Listing.material.ilike(f"%{material}%"))

    items = query.order_by(desc(Listing.created_at)).all()
    filtered = []
    for item in items:
        seller_lat = item.seller.lat if item.seller else 15.9042
        seller_lng = item.seller.lng if item.seller else 80.4674
        dist = haversine_km(user_lat, user_lng, seller_lat, seller_lng)

        if radius_km is not None and dist > radius_km:
            continue

        item.distance_km = round(dist, 1)
        item.seller_name = item.seller.name if item.seller else "Unknown Seller"
        item.seller_city = item.seller.city if item.seller else "Bapatla"
        filtered.append(item)

    return filtered

@router.get("/{listing_id}", response_model=ListingResponse)
def get_listing_detail(listing_id: int, db: Session = Depends(get_db)):
    """Fetches full details of a listing."""
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    if listing.seller:
        listing.seller_name = listing.seller.name
        listing.seller_city = listing.seller.city
    return listing
