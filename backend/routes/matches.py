import os
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from db import get_db
from models import Listing
from schemas import MatchesResult
from agents.matching_agent import run_matching_agent
from agents.fallback_agent import run_fallback_agent

router = APIRouter(prefix="/matches", tags=["Matching"])

@router.get("/{listing_id}", response_model=MatchesResult)
def get_matches_for_listing(
    listing_id: int,
    language: str = Query("en"),
    db: Session = Depends(get_db)
):
    """
    Matching Agent: ranks potential buyers/requests.
    If no matches exist, activates Fallback Agent to recommend
    recyclers, donation centres, or DIY upcycling ideas.
    """
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # Use listing seller's preferred language if not explicitly passed
    if language == "en" and listing.seller and listing.seller.preferred_language:
        language = listing.seller.preferred_language

    matches, match_trace = run_matching_agent(listing, db, language=language)

    fallbacks = []
    has_matches = len(matches) > 0
    if not has_matches:
        fallbacks, fb_trace = run_fallback_agent(listing, language=language)

    return {
        "listing_id": listing.id,
        "has_matches": has_matches,
        "matches": matches,
        "fallbacks": fallbacks
    }
