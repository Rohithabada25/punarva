import os
import json
import time
from typing import Dict, Any, Tuple
from sqlalchemy.orm import Session

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from models import Listing, Impact, ExchangeEvent

FACTORS_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "co2_factors.json")

def _load_factors() -> Dict[str, Any]:
    try:
        with open(FACTORS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"co2_factors_per_kg": {}, "category_default_co2_per_kg": {}, "unit_to_kg_defaults": {}}

def calculate_listing_impact(listing: Listing) -> Dict[str, Any]:
    """
    Deterministic environmental & economic impact calculation.
    Computes kg diverted from landfill, avoided kg CO2 emissions, and money saved.
    """
    factors_data = _load_factors()
    co2_per_kg_map = factors_data.get("co2_factors_per_kg", {})
    cat_co2_map = factors_data.get("category_default_co2_per_kg", {})
    unit_weights = factors_data.get("unit_to_kg_defaults", {})

    # 1. Compute total kg diverted
    if listing.weight_kg and listing.weight_kg > 0:
        total_kg = float(listing.weight_kg)
    else:
        # Convert quantity * unit weight
        unit_lower = (listing.unit or "pieces").lower()
        conv_factor = unit_weights.get(unit_lower, 2.0)
        total_kg = float(listing.quantity or 1.0) * conv_factor

    total_kg = round(total_kg, 2)

    # 2. Determine CO2 factor per kg
    mat_key = listing.material.lower().replace(" ", "_")
    co2_factor = None
    for k, v in co2_per_kg_map.items():
        if k in mat_key or mat_key in k:
            co2_factor = v
            break

    if co2_factor is None:
        cat_key = (listing.category or "other").lower()
        co2_factor = cat_co2_map.get(cat_key, 0.80)

    co2_saved = round(total_kg * co2_factor, 2)

    # 3. Money saved: listing resale value or replacement cost saved
    money_saved = float(listing.price) if listing.price > 0 else round(total_kg * 15.0, 2)

    # 4. Check whether quantity is verified or unverified AI estimate
    is_estimated = (listing.quantity_source == "ai_estimate" and not listing.quantity_verified)

    return {
        "kg_diverted": total_kg,
        "co2_saved": co2_saved,
        "money_saved": money_saved,
        "is_estimated": is_estimated
    }

def run_impact_agent(
    listing: Listing,
    db: Session
) -> Tuple[Impact, Dict[str, Any]]:
    """
    Executes impact recording for eligible completed exchanges.
    Strictly verifies that exchange is eligible (completed, both confirmed).
    Returns: (impact_record, trace_dict)
    """
    t0 = time.time()

    # Verify eligibility
    if not (listing.seller_confirmed and listing.buyer_confirmed and listing.status == "completed"):
        raise ValueError("Exchange is not eligible for impact calculation (must be completed and confirmed by both parties).")

    metrics = calculate_listing_impact(listing)

    # Check if impact record already exists
    existing = db.query(Impact).filter(Impact.listing_id == listing.id).first()
    if existing:
        existing.kg_diverted = metrics["kg_diverted"]
        existing.co2_saved = metrics["co2_saved"]
        existing.money_saved = metrics["money_saved"]
        existing.is_estimated = metrics["is_estimated"]
        impact_record = existing
    else:
        impact_record = Impact(
            listing_id=listing.id,
            kg_diverted=metrics["kg_diverted"],
            co2_saved=metrics["co2_saved"],
            money_saved=metrics["money_saved"],
            is_estimated=metrics["is_estimated"]
        )
        db.add(impact_record)

    # Audit log
    event = ExchangeEvent(
        listing_id=listing.id,
        actor_id=listing.seller_id,
        event="IMPACT_CALCULATED"
    )
    db.add(event)
    db.commit()
    db.refresh(impact_record)

    duration_ms = int((time.time() - t0) * 1000)
    trace = {
        "agent": "Impact Agent",
        "status": "success",
        "summary": f"Calculated: {metrics['kg_diverted']} kg diverted, {metrics['co2_saved']} kg CO2 saved, ₹{metrics['money_saved']} saved (Estimated: {metrics['is_estimated']})",
        "duration_ms": duration_ms
    }
    return impact_record, trace
