import time
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from models import Listing
from rag.retriever import retrieve_recyclers, retrieve_reuse_guides

def run_fallback_agent(
    listing: Listing,
    language: str = "en"
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Fallback Agent: runs when no matching direct buyer is found.
    Recommends local recyclers, donation targets from recycler_directory, or a DIY reuse project.
    Returns: (fallbacks_list, trace_dict)
    """
    t0 = time.time()
    query = f"{listing.material} {listing.category} {listing.seller.city if listing.seller else 'Bapatla'}"

    recyclers = retrieve_recyclers(query, top_k=2, category=listing.category)
    guides = retrieve_reuse_guides(query, top_k=1)

    fallbacks: List[Dict[str, Any]] = []

    # Recycler / Donation options from directory
    for r in recyclers:
        if language == "te":
            desc = f"{r.get('notes', '')} - చిరునామా: {r.get('address', '')}"
        elif language == "hi":
            desc = f"{r.get('notes', '')} - पता: {r.get('address', '')}"
        else:
            desc = f"{r.get('notes', '')} - Address: {r.get('address', '')}"

        fallbacks.append({
            "type": r.get("type", "recycler"),
            "name": r.get("name", "Local Facility"),
            "description": desc,
            "location": f"{r.get('city', 'Local')} ({r.get('address', '')})",
            "contact": r.get("contact", "")
        })

    # DIY Upcycling fallback idea
    if guides:
        g = guides[0]
        if language == "te":
            diy_desc = f"మీరే స్వయంగా తయారుచేయండి (DIY): {g.get('document', '')[:160]}..."
        elif language == "hi":
            diy_desc = f"स्वयं करें (DIY): {g.get('document', '')[:160]}..."
        else:
            diy_desc = f"Do-It-Yourself (DIY) Idea: {g.get('document', '')[:160]}..."

        fallbacks.append({
            "type": "diy",
            "name": g.get("title", "Creative DIY Upcycling"),
            "description": diy_desc,
            "guide_title": g.get("title", "")
        })

    duration_ms = int((time.time() - t0) * 1000)
    trace = {
        "agent": "Fallback Agent",
        "status": "success",
        "summary": f"Generated {len(fallbacks)} recycling, donation, and DIY alternatives",
        "duration_ms": duration_ms
    }
    return fallbacks, trace
