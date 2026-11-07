import json
import time
from typing import Dict, Any, Tuple, List
from pydantic import BaseModel

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from llm import call_gemini, clean_json_markdown
from rag.retriever import retrieve_reuse_guides, retrieve_material_standards

class ReuseOutput(BaseModel):
    action: str  # reuse, repair, recycle, repurpose
    recommendation: str
    sources: List[str]

def run_reuse_agent(
    material_type: str,
    category: str,
    condition: str,
    quantity: float,
    unit: str,
    language: str = "en"
) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """
    RAG-powered Reuse Agent.
    Retrieves context from ChromaDB and prompts Gemini for recommendation.
    Returns: (result_dict, trace_dict)
    """
    t0 = time.time()

    # 1. RAG retrieval from BOTH collections with top_k of 4 and relevance thresholds
    search_query = f"{material_type} {category} {condition}"
    guides = retrieve_reuse_guides(search_query, top_k=4)
    standards = retrieve_material_standards(search_query, top_k=4)

    citations = []
    context_lines = []
    seen_titles = set()

    for g in guides:
        title = g.get("title", "").strip()
        if title and title not in seen_titles:
            seen_titles.add(title)
            citations.append(title)
            context_lines.append(f"[Guide: {title}]\n{g['document']}")

    for s in standards:
        code = s.get("standard_code", "").strip()
        title = f"{s['title']} ({code})" if code else s["title"]
        if title and title not in seen_titles:
            seen_titles.add(title)
            citations.append(title)
            context_lines.append(f"[Standard: {title}]\n{s['document']}")

    # Keep 2-4 distinct sources if available
    citations = citations[:4]
    has_specific_guides = len(citations) > 0
    if not has_specific_guides:
        citations = ["No specific guideline found"]
        context_str = "No specific technical standards or guides found in database for this exact material."
    else:
        context_str = "\n\n".join(context_lines)

    lang_instructions = {
        "te": f"రచనలో స్పష్టంగా '{material_type}' మెటీరియల్ పేరును మరియు దాని '{condition}' స్థితిని పేర్కొనండి. Action అనేది [reuse, repair, recycle, repurpose] లలో ఒకటిగా ఆంగ్లంలో ఉండాలి. మిగిలిన వాక్యాలు సహజమైన తెలుగులో ఉండాలి.",
        "hi": f"विवरण में सामग्री '{material_type}' का नाम और उसकी स्थिति '{condition}' स्पष्ट रूप से लिखें। Action [reuse, repair, recycle, repurpose] में से एक अंग्रेजी में हो, बाकी वाक्य स्वाभाविक हिन्दी में हों।",
        "en": f"The recommendation MUST explicitly name the specific material '{material_type}' and address its condition '{condition}'. Action must be one of: reuse, repair, recycle, repurpose."
    }
    lang_note = lang_instructions.get(language, lang_instructions["en"])

    prompt = f"""
You are the Reuse & Circular Engineering Agent for Punarva.
A user has listed:
- Material: {material_type}
- Category: {category}
- Condition: {condition}
- Quantity: {quantity} {unit}

Authoritative technical guides and Indian Bureau of Standards guidelines retrieved from RAG knowledge base:
{context_str}

Task:
1. The recommendation MUST specifically name the material '{material_type}' and address its condition '{condition}'.
2. Recommend the SINGLE BEST sustainable action among [reuse, repair, recycle, repurpose].
3. Provide a practical 2-3 sentence step-by-step how-to.
4. If no specific guidelines were found in the knowledge base, state "No specific guideline found" and advise on safe general storage or disposal for {material_type}.
5. Cite the exact titles of the retrieved sources in the "sources" list.

{lang_note}

Output ONLY valid JSON:
{{
  "action": "<one of: reuse, repair, recycle, repurpose>",
  "recommendation": "<2-3 sentence actionable guide in {language} explicitly naming {material_type}>",
  "sources": {json.dumps(citations)}
}}
"""

    system_instruction = "You are a circular economy reuse expert. Output strict valid JSON."

    raw_response, is_mocked = call_gemini(
        prompt=prompt,
        system_instruction=system_instruction,
        json_mode=True,
        retries=1
    )

    result_data = None
    if not is_mocked and raw_response:
        try:
            cleaned = clean_json_markdown(raw_response)
            parsed = json.loads(cleaned)
            # Ensure sources are populated
            if not parsed.get("sources"):
                parsed["sources"] = citations
            valid = ReuseOutput(**parsed)
            result_data = valid.model_dump()
        except Exception:
            is_mocked = True

    if is_mocked or not result_data:
        is_mocked = True
        default_recs = {
            "te": f"ఈ {material_type} ({condition} స్థితి) మెటీరియల్‌ను నేరుగా ప్రాజెక్టులలో తిరిగి ఉపయోగించవచ్చు (reuse). ఉపయోగించే ముందు ఉపరితలాన్ని శుభ్రం చేసి భద్రపరచండి.",
            "hi": f"इस {material_type} ({condition} स्थिति) को सीधे नवीनीकरण परियोजनाओं में पुन: उपयोग (reuse) किया जा सकता है। प्रयोग से पहले सतह को साफ कर लें।",
            "en": f"This {material_type} in {condition} condition can be directly reused for secondary applications or non-structural projects. Clean surface debris and store elevated away from moisture."
        }
        result_data = {
            "action": "reuse",
            "recommendation": default_recs.get(language, default_recs["en"]),
            "sources": citations if citations else ["No specific guideline found"]
        }

    duration_ms = int((time.time() - t0) * 1000)
    source_count = len([s for s in result_data['sources'] if s != "No specific guideline found"])
    summary_src = f"{source_count} source{'s' if source_count != 1 else ''} cited" if source_count > 0 else "No specific guideline found"
    trace = {
        "agent": "Reuse Agent (RAG)",
        "status": "mocked" if is_mocked else "success",
        "summary": f"Recommended {result_data['action'].upper()} for {material_type} ({summary_src})",
        "duration_ms": duration_ms
    }
    return result_data, trace
