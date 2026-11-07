import math
import time
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from models import Listing, Offer, User

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)

def run_negotiation_agent(
    listing: Listing,
    offers: List[Offer],
    language: str = "en"
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Ranks offers on a listing by price and buyer proximity.
    Labels top ranked offer as 'Best offer' with justification.
    Returns: (ranked_offers_list, trace_dict)
    """
    t0 = time.time()
    if not offers:
        duration_ms = int((time.time() - t0) * 1000)
        trace = {
            "agent": "Negotiation Agent",
            "status": "success",
            "summary": "No offers currently pending for this listing",
            "duration_ms": duration_ms
        }
        return [], trace

    seller_lat = listing.seller.lat if listing.seller else 15.9042
    seller_lng = listing.seller.lng if listing.seller else 80.4674

    scored = []
    for offer in offers:
        buyer = offer.buyer
        b_lat = buyer.lat if buyer else 15.9042
        b_lng = buyer.lng if buyer else 80.4674
        dist = haversine_km(seller_lat, seller_lng, b_lat, b_lng)

        # Score formula: price weight 70%, proximity 30%
        # Proximity score (0 at 50km, 1 at 0km)
        prox_score = max(0.0, 1.0 - (dist / 50.0))
        # Price score compared to listing price
        if listing.price > 0:
            price_score = offer.price / listing.price
        else:
            price_score = 1.0

        rank_score = (price_score * 0.70) + (prox_score * 0.30)
        scored.append((rank_score, dist, offer))

    scored.sort(key=lambda x: x[0], reverse=True)

    ranked_results = []
    for i, (score, dist, offer) in enumerate(scored):
        is_best = (i == 0 and offer.status != "declined")
        buyer_name = offer.buyer.name if offer.buyer else "Buyer"
        buyer_city = offer.buyer.city if offer.buyer else "Local"

        # Generate reason
        if is_best:
            diff_pct = 0
            if listing.price > 0:
                diff_pct = int(((offer.price - listing.price) / listing.price) * 100)
            
            if language == "te":
                reason = f"ఉత్తమ ఆఫర్: ₹{int(offer.price)} ({dist} కి.మీ దూరం, శీఘ్ర పికప్ అనుకూలం)."
            elif language == "hi":
                reason = f"सर्वश्रेष्ठ प्रस्ताव: ₹{int(offer.price)} ({dist} किमी दूरी, त्वरित पिकअप के लिए उपयुक्त)।"
            else:
                reason = f"Best offer: ₹{int(offer.price)} ({dist} km away, optimal for rapid offline pickup)."
        else:
            if language == "te":
                reason = f"{dist} కి.మీ దూరం."
            elif language == "hi":
                reason = f"{dist} किमी दूरी।"
            else:
                reason = f"{dist} km away."

        ranked_results.append({
            "id": offer.id,
            "listing_id": offer.listing_id,
            "buyer_id": offer.buyer_id,
            "buyer_name": buyer_name,
            "buyer_city": buyer_city,
            "price": offer.price,
            "message": offer.message,
            "status": offer.status,
            "created_at": offer.created_at,
            "is_best_offer": is_best,
            "negotiation_reason": reason
        })

    duration_ms = int((time.time() - t0) * 1000)
    best_text = f"Top offer ₹{ranked_results[0]['price']} by {ranked_results[0]['buyer_name']}" if ranked_results else "No offers"
    trace = {
        "agent": "Negotiation Agent",
        "status": "success",
        "summary": f"Ranked {len(offers)} offers. {best_text}",
        "duration_ms": duration_ms
    }
    return ranked_results, trace
