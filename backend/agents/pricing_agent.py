import os
import json
import time
from typing import Dict, Any, Tuple
from pydantic import BaseModel

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from llm import call_gemini, clean_json_markdown

PRICING_TABLE_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "pricing_table.json")

class PricingOutput(BaseModel):
    suggested_price: float
    price_range: Dict[str, float]  # {"min": ..., "max": ...}
    explanation: str

def _load_pricing_data() -> Dict[str, Any]:
    try:
        with open(PRICING_TABLE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"materials": {}, "default_category_rates_per_kg": {}}

def run_pricing_agent(
    material_type: str,
    category: str,
    condition: str,
    quantity: float,
    unit: str,
    confidence: float = 0.85,
    language: str = "en"
) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """
    Pricing Agent: computes fair market reuse price based on per-unit baseline tables and condition.
    Does NOT invent prices when confidence is low or material is unknown.
    Returns: (result_dict, trace_dict)
    """
    t0 = time.time()
    mat_lower = material_type.lower().strip()

    # If material is unknown or confidence is low, do NOT invent a price: prompt seller to enter it
    if confidence < 0.60 or "unknown" in mat_lower:
        explanations_need_input = {
            "te": "ధర మీ ఇన్‌పుట్ అవసరం — మెటీరియల్ ఖచ్చితత్వం తక్కువగా ఉంది. దయచేసి మీ సరసమైన ధరను నమోదు చేయండి.",
            "hi": "कीमत के लिए आपके इनपुट की आवश्यकता है — पहचान स्पष्ट नहीं है। कृपया उचित मूल्य दर्ज करें।",
            "en": "Price needs your input — low identification confidence. Please enter your fair valuation."
        }
        result_data = {
            "suggested_price": 0.0,
            "price_range": {"min": 0.0, "max": 0.0},
            "explanation": explanations_need_input.get(language, explanations_need_input["en"])
        }
        trace = {
            "agent": "Pricing Agent",
            "status": "success",
            "summary": "Price needs seller input (low confidence or unverified material)",
            "duration_ms": int((time.time() - t0) * 1000)
        }
        return result_data, trace

    pricing_data = _load_pricing_data()
    materials = pricing_data.get("materials", {})
    unit_lower = unit.lower().strip()

    # Find matching material definition by alias or category
    matched_entry = None
    for k, v in materials.items():
        aliases = v.get("aliases", [k])
        if any(alias in mat_lower for alias in aliases) or any(mat_lower in alias for alias in aliases):
            matched_entry = v
            break

    # If not matched by name, match by category
    if not matched_entry:
        for k, v in materials.items():
            if v.get("category", "").lower() == category.lower():
                matched_entry = v
                break

    # Default condition multipliers
    std_multipliers = {
        "new": 0.85,
        "good": 0.65,
        "fair": 0.45,
        "poor": 0.25
    }

    if matched_entry:
        cond_mults = matched_entry.get("condition_multipliers", std_multipliers)
        multiplier = cond_mults.get(condition.lower(), 0.50)
        unit_rates = matched_entry.get("unit_rates", {})

        # Unit handling: match exact unit, or fallback to default rate
        if unit_lower in unit_rates:
            base_unit_price = unit_rates[unit_lower]
        elif unit_lower in ("piece", "pieces", "units", "unit") and "pieces" in unit_rates:
            base_unit_price = unit_rates["pieces"]
        elif unit_lower in ("bag", "bags") and "bags" in unit_rates:
            base_unit_price = unit_rates["bags"]
        elif unit_lower in ("ton", "tons", "tonne") and "tons" in unit_rates:
            base_unit_price = unit_rates["tons"]
        elif unit_lower in ("kg", "kgs") and "kg" in unit_rates:
            base_unit_price = unit_rates["kg"]
        elif unit_lower in ("sqft", "sq ft", "sft") and "sqft" in unit_rates:
            base_unit_price = unit_rates["sqft"]
        elif unit_rates:
            base_unit_price = list(unit_rates.values())[0]
        else:
            base_unit_price = matched_entry.get("base_price_new", 50.0)
    else:
        multiplier = std_multipliers.get(condition.lower(), 0.50)
        cat_defaults = pricing_data.get("default_category_unit_rates", {})
        cat_info = cat_defaults.get(category.lower(), {"rate": 20.0})
        base_unit_price = cat_info.get("rate", 20.0)

    calc_unit_price = round(base_unit_price * multiplier, 2)
    # price = unit price x quantity x condition multiplier (no default ₹50 floor!)
    calc_total = round(quantity * calc_unit_price, 2)

    min_price = round(calc_total * 0.85, 2)
    max_price = round(calc_total * 1.15, 2)

    # Standard explanation showing unit price, quantity, and condition
    std_explanations = {
        "te": f"{condition} స్థితిలో ఉన్న {quantity:g} {unit} కి ఒక్కో {unit} ధర ₹{calc_unit_price:g} చొప్పున మొత్తం ₹{calc_total:g} గా నిర్ణయించబడింది (కొత్త విలువలో {int(multiplier*100)}%).",
        "hi": f"{condition} स्थिति में {quantity:g} {unit} के लिए ₹{calc_unit_price:g}/{unit} की दर से कुल ₹{calc_total:g} का उचित मूल्य (नए मूल्य का {int(multiplier*100)}%)।",
        "en": f"Valued at ₹{calc_unit_price:g}/{unit} for {quantity:g} {unit} in {condition} condition ({int(multiplier*100)}% of new retail value)."
    }

    # Prompt LLM for natural-sounding phrasing if needed, but enforce factual consistency
    prompt = f"""
You are the Pricing Valuation Agent for Punarva salvage exchange.
Material: {material_type} ({category})
Quantity: {quantity} {unit}
Condition: {condition}
Unit Rate (condition adjusted): ₹{calc_unit_price}/{unit}
Calculated Total Price: ₹{calc_total} (Range: ₹{min_price} to ₹{max_price})

Task: Output a single concise sentence in {language} explaining this valuation. It MUST mention the unit rate ₹{calc_unit_price}/{unit}, quantity {quantity} {unit}, and condition '{condition}'.

Output ONLY valid JSON:
{{
  "suggested_price": {calc_total},
  "price_range": {{"min": {min_price}, "max": {max_price}}},
  "explanation": "<one sentence in {language} stating unit price, quantity and condition>"
}}
"""

    raw_response, is_mocked = call_gemini(
        prompt=prompt,
        system_instruction="You are a salvage material pricing analyst. Output JSON only.",
        json_mode=True,
        retries=1
    )

    result_data = None
    if not is_mocked and raw_response:
        try:
            cleaned = clean_json_markdown(raw_response)
            parsed = json.loads(cleaned)
            # Ensure price fields match our formula
            parsed["suggested_price"] = calc_total
            parsed["price_range"] = {"min": min_price, "max": max_price}
            if not parsed.get("explanation"):
                parsed["explanation"] = std_explanations.get(language, std_explanations["en"])
            valid = PricingOutput(**parsed)
            result_data = valid.model_dump()
        except Exception:
            is_mocked = True

    if is_mocked or not result_data:
        is_mocked = True
        result_data = {
            "suggested_price": calc_total,
            "price_range": {"min": min_price, "max": max_price},
            "explanation": std_explanations.get(language, std_explanations["en"])
        }

    duration_ms = int((time.time() - t0) * 1000)
    trace = {
        "agent": "Pricing Agent",
        "status": "mocked" if is_mocked else "success",
        "summary": f"Suggested ₹{result_data['suggested_price']} (₹{calc_unit_price}/{unit} × {quantity} {unit}, condition: {condition})",
        "duration_ms": duration_ms
    }
    return result_data, trace
