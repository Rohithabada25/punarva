from typing import Dict, Any, List, TypedDict, Optional
from langgraph.graph import StateGraph, START, END

from agents.vision_agent import run_vision_agent
from agents.reuse_agent import run_reuse_agent
from agents.pricing_agent import run_pricing_agent

class AnalysisState(TypedDict):
    image_bytes: bytes
    language: str
    vision_result: Optional[Dict[str, Any]]
    reuse_result: Optional[Dict[str, Any]]
    pricing_result: Optional[Dict[str, Any]]
    agent_trace: List[Dict[str, Any]]

def vision_node(state: AnalysisState) -> Dict[str, Any]:
    vision_res, trace = run_vision_agent(state["image_bytes"], language=state.get("language", "en"))
    current_traces = list(state.get("agent_trace", []))
    current_traces.append(trace)
    return {
        "vision_result": vision_res,
        "agent_trace": current_traces
    }

def reuse_node(state: AnalysisState) -> Dict[str, Any]:
    v = state["vision_result"]
    reuse_res, trace = run_reuse_agent(
        material_type=v["material_type"],
        category=v["category"],
        condition=v["condition"],
        quantity=v["estimated_quantity"],
        unit=v["unit"],
        language=state.get("language", "en")
    )
    current_traces = list(state.get("agent_trace", []))
    current_traces.append(trace)
    return {
        "reuse_result": reuse_res,
        "agent_trace": current_traces
    }

def pricing_node(state: AnalysisState) -> Dict[str, Any]:
    v = state["vision_result"]
    pricing_res, trace = run_pricing_agent(
        material_type=v["material_type"],
        category=v["category"],
        condition=v["condition"],
        quantity=v["estimated_quantity"],
        unit=v["unit"],
        confidence=v.get("confidence", 0.85),
        language=state.get("language", "en")
    )
    current_traces = list(state.get("agent_trace", []))
    current_traces.append(trace)
    return {
        "pricing_result": pricing_res,
        "agent_trace": current_traces
    }

# Build LangGraph workflow
workflow = StateGraph(AnalysisState)
workflow.add_node("vision_agent", vision_node)
workflow.add_node("reuse_agent", reuse_node)
workflow.add_node("pricing_agent", pricing_node)

workflow.add_edge(START, "vision_agent")
workflow.add_edge("vision_agent", "reuse_agent")
workflow.add_edge("reuse_agent", "pricing_agent")
workflow.add_edge("pricing_agent", END)

listing_analysis_app = workflow.compile()

def run_listing_analysis(image_bytes: bytes, language: str = "en") -> Dict[str, Any]:
    """Runs the LangGraph Vision -> Reuse -> Pricing pipeline and returns consolidated output."""
    initial_state: AnalysisState = {
        "image_bytes": image_bytes,
        "language": language,
        "vision_result": None,
        "reuse_result": None,
        "pricing_result": None,
        "agent_trace": []
    }

    final_state = listing_analysis_app.invoke(initial_state)

    v = final_state["vision_result"]
    r = final_state["reuse_result"]
    p = final_state["pricing_result"]
    traces = final_state.get("agent_trace", [])
    any_mocked = any(t.get("status") == "mocked" for t in traces) or v.get("is_mocked", False)

    return {
        "material_type": v["material_type"],
        "category": v["category"],
        "estimated_quantity": v["estimated_quantity"],
        "unit": v["unit"],
        "condition": v["condition"],
        "hazard_flag": v["hazard_flag"],
        "hazard_note": v.get("hazard_note", ""),
        "confidence": v["confidence"],
        "suggested_price": p["suggested_price"],
        "price_range": p["price_range"],
        "price_explanation": p["explanation"],
        "reuse_recommendation": r["recommendation"],
        "reuse_sources": r["sources"],
        "is_mocked": any_mocked,
        "agent_trace": traces
    }
