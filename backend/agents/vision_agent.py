import io
import json
import time
import hashlib
from typing import Dict, Any, Tuple
from PIL import Image
from pydantic import BaseModel, Field

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from llm import call_gemini, clean_json_markdown, GEMINI_MODEL

# Cache to avoid re-analyzing the same image during demo / testing
_ANALYSIS_CACHE: Dict[str, Dict[str, Any]] = {}

class VisionOutput(BaseModel):
    material_type: str
    category: str  # construction, tiles, wood, furniture, metals, plastics, electronics, other
    estimated_quantity: float
    unit: str
    condition: str  # new, good, fair, poor
    hazard_flag: bool
    hazard_note: str = ""
    confidence: float = 0.85
    is_mocked: bool = False

def resize_image(image_bytes: bytes, max_dim: int = 1024) -> Tuple[bytes, str]:
    """Resizes image to max_dim on the largest side while preserving aspect ratio."""
    img = Image.open(io.BytesIO(image_bytes))
    # Convert RGBA or CMYK to RGB
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")
    
    w, h = img.size
    if max(w, h) > max_dim:
        scale = max_dim / max(w, h)
        new_w = int(w * scale)
        new_h = int(h * scale)
        img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

    out_io = io.BytesIO()
    img.save(out_io, format="JPEG", quality=85)
    return out_io.getvalue(), "image/jpeg"

def run_vision_agent(image_bytes: bytes, language: str = "en") -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """
    Analyzes material photo using Gemini Vision.
    Returns: (result_dict, trace_dict)
    Trace format: {agent, status, summary, duration_ms}
    """
    t0 = time.time()
    img_hash = hashlib.sha256(image_bytes).hexdigest()
    # Cache key MUST be sha256 of image bytes + language + model name
    cache_key = f"{img_hash}_{language}_{GEMINI_MODEL}"

    if cache_key in _ANALYSIS_CACHE:
        duration_ms = int((time.time() - t0) * 1000)
        cached_result = _ANALYSIS_CACHE[cache_key]
        trace = {
            "agent": "Vision Agent",
            "status": "cached",
            "summary": f"Identified {cached_result.get('material_type')} (~{cached_result.get('estimated_quantity')} {cached_result.get('unit')}) [cached]",
            "duration_ms": duration_ms
        }
        return cached_result, trace

    # Resize image
    try:
        resized_bytes, mime_type = resize_image(image_bytes, max_dim=1024)
    except Exception as e:
        resized_bytes = image_bytes
        mime_type = "image/jpeg"

    lang_instructions = {
        "te": "Write user-facing descriptions (hazard_note, material_type label) in Telugu (తెలుగు script). Category and condition must remain English standard enums.",
        "hi": "Write user-facing descriptions (hazard_note, material_type label) in Hindi (हिन्दी script). Category and condition must remain English standard enums.",
        "en": "Write all text in English."
    }
    lang_note = lang_instructions.get(language, lang_instructions["en"])

    prompt = f"""
You are an expert materials surveyor and salvage engineer for 'Punarva', an Indian circular economy and waste-to-resource platform.
Inspect this photograph of unused, salvageable, or discarded material.

{lang_note}

Determine the EXACT material and select a realistic, appropriate bulk unit:
- Bricks / Blocks / Pavers: unit "pieces", estimate visible count (e.g. 50, 200, 500)
- Cement / Plaster: unit "bags" (50kg bags) or "kg", estimate quantity of bags or mass
- Sand / Aggregates / Gravel: unit "tons" or "kg" or "cft"
- Tiles / Granite / Marble slabs: unit "sqft" or "pieces"
- Wood / Timber / Beams: unit "pieces" or "cft" or "kg"
- Furniture (chairs, tables, desks, doors): unit "pieces", count items (e.g. 1.0, 4.0, 6.0)
- Metals / Steel TMT bars / Aluminium: unit "kg" or "tons" or "pieces"
- Plastics / PVC pipes / Drums: unit "pieces" (if barrels) or "meters" (if pipes) or "kg"
- Electronics / E-waste / Cables / PCBs: unit "pieces" or "units" or "kg"
- Cardboard / Packaging: unit "kg" or "bundles"

DO NOT blindly return 1.0 pieces for bulk materials (like bricks, tiles, sand, or cement). Provide a probable realistic estimate.

You must return ONLY a valid JSON object with EXACTLY this structure:
{{
  "material_type": "<specific material name e.g. Red clay bricks, Portland cement bags, Vitrified floor tiles, Teak wood table, Electronic circuit boards, etc.>",
  "category": "<one of exactly: construction, tiles, wood, furniture, metals, plastics, electronics, other>",
  "estimated_quantity": <probable estimated numerical count or volume/weight as a float, e.g. 150.0>,
  "unit": "<one of: pieces, bags, tons, kg, sqft, cft, sheets, meters, bundles, units>",
  "condition": "<one of exactly: new, good, fair, poor>",
  "hazard_flag": <true if sharp edges, heavy jagged rust, toxic e-waste, lead/chemical residue, otherwise false>,
  "hazard_note": "<short safety warning if hazard_flag is true, e.g. 'Sharp chipped edges, handle with gloves', otherwise empty string>",
  "confidence": <confidence score between 0.50 and 0.98>
}}

NOTE: The quantity is only a PROBABLE ESTIMATE.
DO NOT wrap the response in markdown blocks other than clean JSON.
"""

    system_instruction = "You are a professional industrial salvage vision assistant. Output strict valid JSON only."

    raw_response, is_mocked = call_gemini(
        prompt=prompt,
        image_bytes=resized_bytes,
        mime_type=mime_type,
        system_instruction=system_instruction,
        json_mode=True,
        retries=1
    )

    print(f"[Vision Agent] Raw Gemini Response received (is_mocked={is_mocked}):\n{raw_response.strip() if raw_response else '<EMPTY>'}", flush=True)

    result_data = None
    if not is_mocked and raw_response:
        try:
            cleaned = clean_json_markdown(raw_response)
            parsed = json.loads(cleaned)
            # Normalize and validate with Pydantic
            valid = VisionOutput(**parsed)
            result_data = valid.model_dump()
            result_data["is_mocked"] = False
        except Exception as e:
            print(f"[Vision Agent] JSON parse/validation error: {e}", flush=True)
            is_mocked = True

    # Safe fallback if Gemini unavailable or failed
    if is_mocked or not result_data:
        is_mocked = True
        print("[Vision Agent WARNING] Returning default fallback response. This will NOT be cached.", flush=True)
        if language == "te":
            result_data = {
                "material_type": "ఎర్ర ఇటుకలు (Red Bricks)",
                "category": "construction",
                "estimated_quantity": 50.0,
                "unit": "pieces",
                "condition": "good",
                "hazard_flag": False,
                "hazard_note": "",
                "confidence": 0.50,
                "is_mocked": True
            }
        elif language == "hi":
            result_data = {
                "material_type": "लाल मिट्टी की ईंटें (Red Bricks)",
                "category": "construction",
                "estimated_quantity": 50.0,
                "unit": "pieces",
                "condition": "good",
                "hazard_flag": False,
                "hazard_note": "",
                "confidence": 0.50,
                "is_mocked": True
            }
        else:
            result_data = {
                "material_type": "Red clay bricks",
                "category": "construction",
                "estimated_quantity": 50.0,
                "unit": "pieces",
                "condition": "good",
                "hazard_flag": False,
                "hazard_note": "",
                "confidence": 0.50,
                "is_mocked": True
            }

    # NEVER cache mocked or failed results!
    if not is_mocked:
        _ANALYSIS_CACHE[cache_key] = result_data

    duration_ms = int((time.time() - t0) * 1000)
    trace = {
        "agent": "Vision Agent",
        "status": "mocked" if is_mocked else "success",
        "summary": f"Detected {result_data['material_type']} (estimated {result_data['estimated_quantity']} {result_data['unit']}, condition: {result_data['condition']}){' [MOCKED/DEFAULT]' if is_mocked else ''}",
        "duration_ms": duration_ms
    }
    return result_data, trace
