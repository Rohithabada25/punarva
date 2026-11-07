import math
import time
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from models import Listing, Request, User
from llm import get_embedding

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance in kilometers."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    """Computes cosine similarity between two vectors."""
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot = sum(a * b for a, b in zip(v1, v2))
    norm1 = sum(a * a for a in v1) ** 0.5
    norm2 = sum(b * b for b in v2) ** 0.5
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return max(0.0, min(1.0, dot / (norm1 * norm2)))

def run_matching_agent(
    listing: Listing,
    db: Session,
    language: str = "en"
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Ranks buyer requests for a listing based on semantic similarity, distance,
    quantity match, and budget fit.
    Returns: (matches_list, trace_dict)
    """
    t0 = time.time()
    seller = listing.seller
    seller_lat = seller.lat if seller else 15.9042
    seller_lng = seller.lng if seller else 80.4674

    requests = db.query(Request).all()
    if not requests:
        duration_ms = int((time.time() - t0) * 1000)
        trace = {
            "agent": "Matching Agent",
            "status": "success",
            "summary": "No buyer requests found in database",
            "duration_ms": duration_ms
        }
        return [], trace

    # Listing material embedding
    listing_emb = get_embedding(f"{listing.material} {listing.category}")

    candidates = []
    for req in requests:
        if req.buyer_id == listing.seller_id:
            continue  # Don't match seller with themselves

        dist_km = haversine_km(seller_lat, seller_lng, req.lat, req.lng)
        # Distance score (1.0 at 0km, 0.0 at >= 50km)
        dist_score = max(0.0, 1.0 - (dist_km / 50.0))

        # Semantic match score
        req_emb = get_embedding(f"{req.material}")
        sim_score = cosine_similarity(listing_emb, req_emb)

        # Keyword overlap bonus
        if req.material.lower() in listing.material.lower() or listing.material.lower() in req.material.lower():
            sim_score = max(sim_score, 0.90)

        # Word overlap check
        is_word_match = any(w in listing.material.lower() for w in req.material.lower().split() if len(w) > 3)
        if sim_score < 0.68 and not is_word_match:
            continue

        # Budget score
        budget_ratio = 1.0
        if listing.price > 0:
            budget_ratio = min(1.5, req.budget / listing.price)
        budget_score = 1.0 if budget_ratio >= 0.85 else (budget_ratio / 0.85)

        # Quantity compatibility
        qty_ratio = min(listing.quantity, req.quantity) / max(listing.quantity, req.quantity)

        # Composite score
        total_score = (sim_score * 0.40) + (dist_score * 0.30) + (budget_score * 0.20) + (qty_ratio * 0.10)

        buyer_user = db.query(User).filter(User.id == req.buyer_id).first()
        buyer_name = buyer_user.name if buyer_user else "Local Buyer"
        buyer_city = buyer_user.city if buyer_user else "Bapatla"
        is_org = req.is_org or (buyer_user.role == "org" if buyer_user else False)

        # Format human-readable reason in user's language
        if language == "te":
            reason = f"{dist_km} కి.మీ దూరం, బడ్జెట్ ₹{int(req.budget)}, {req.quantity} {listing.unit} అవసరం."
            if is_org:
                reason = f"సంస్థ/కళాశాల అవసరం: {reason}"
        elif language == "hi":
            reason = f"{dist_km} किमी दूरी, ₹{int(req.budget)} बजट, {req.quantity} {listing.unit} की आवश्यकता।"
            if is_org:
                reason = f"संस्था/कॉलेज आवश्यकता: {reason}"
        else:
            reason = f"{dist_km} km away, ₹{int(req.budget)} budget, needs {req.quantity} {listing.unit}."
            if is_org:
                reason = f"Organization need: {reason}"

        candidates.append({
            "buyer_id": req.buyer_id,
            "buyer_name": buyer_name,
            "is_org": is_org,
            "city": buyer_city,
            "distance_km": dist_km,
            "requested_qty": req.quantity,
            "budget": req.budget,
            "match_score": round(total_score, 3),
            "match_reason": reason
        })

    # Sort descending by match score
    candidates.sort(key=lambda x: x["match_score"], reverse=True)
    top_matches = candidates[:5]

    duration_ms = int((time.time() - t0) * 1000)
    trace = {
        "agent": "Matching Agent",
        "status": "success",
        "summary": f"Found {len(top_matches)} potential buyers/organizations within radius",
        "duration_ms": duration_ms
    }
    return top_matches, trace
