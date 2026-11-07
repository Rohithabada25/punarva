import os
import json
import base64
import time
import hashlib
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

# Ensure Windows SSL certificate verification works with corporate/system certs
try:
    import truststore
    truststore.inject_into_ssl()
except Exception:
    pass

import requests

dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=dotenv_path, override=False)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite").strip()
GEMINI_EMBED_MODEL = os.getenv("GEMINI_EMBED_MODEL", "gemini-embedding-001").strip()

if not GEMINI_API_KEY:
    print("[WARNING] GEMINI_API_KEY is not set. Agents will use safe fallback responses.")

# Initialize Google GenAI client
_genai_client = None
try:
    from google import genai
    from google.genai import types
    if GEMINI_API_KEY:
        _genai_client = genai.Client(api_key=GEMINI_API_KEY)
except Exception as e:
    print(f"[INFO] google-genai client init note: {e}. Will use REST fallback if needed.")

def _call_gemini_sdk(
    prompt: str,
    image_bytes: Optional[bytes] = None,
    mime_type: str = "image/jpeg",
    system_instruction: Optional[str] = None,
    json_mode: bool = False
) -> str:
    """Invokes Gemini using official google-genai SDK."""
    if not _genai_client:
        raise RuntimeError("GenAI client not initialized")

    config_args: Dict[str, Any] = {}
    if system_instruction:
        config_args["system_instruction"] = system_instruction
    if json_mode:
        config_args["response_mime_type"] = "application/json"

    config = types.GenerateContentConfig(**config_args) if config_args else None

    contents = []
    if image_bytes:
        contents.append(
            types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
        )
    contents.append(prompt)

    response = _genai_client.models.generate_content(
        model=GEMINI_MODEL,
        contents=contents,
        config=config
    )
    return response.text or ""

def _call_gemini_rest(
    prompt: str,
    image_bytes: Optional[bytes] = None,
    mime_type: str = "image/jpeg",
    system_instruction: Optional[str] = None,
    json_mode: bool = False
) -> str:
    """REST fallback for Gemini API using x-goog-api-key header and query parameter."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY
    }
    params = {"key": GEMINI_API_KEY}

    parts: List[Dict[str, Any]] = []
    if image_bytes:
        parts.append({
            "inline_data": {
                "mime_type": mime_type,
                "data": base64.b64encode(image_bytes).decode("utf-8")
            }
        })
    parts.append({"text": prompt})

    payload: Dict[str, Any] = {
        "contents": [{"parts": parts}]
    }

    if system_instruction:
        payload["systemInstruction"] = {
            "parts": [{"text": system_instruction}]
        }

    if json_mode:
        payload["generationConfig"] = {
            "responseMimeType": "application/json"
        }

    resp = requests.post(url, headers=headers, params=params, json=payload, timeout=45)
    resp.raise_for_status()
    data = resp.json()
    candidates = data.get("candidates", [])
    if candidates and "content" in candidates[0] and "parts" in candidates[0]["content"]:
        parts_out = candidates[0]["content"]["parts"]
        return "".join(p.get("text", "") for p in parts_out)
    return ""

def call_gemini(
    prompt: str,
    image_bytes: Optional[bytes] = None,
    mime_type: str = "image/jpeg",
    system_instruction: Optional[str] = None,
    json_mode: bool = False,
    retries: int = 1
) -> tuple[str, bool]:
    """
    Unified entry point for Gemini calls.
    Returns: (output_text, is_mocked)
    Tries SDK first -> then REST -> retries once -> falls back gracefully.
    """
    for attempt in range(retries + 1):
        # 1. Try SDK
        try:
            res = _call_gemini_sdk(prompt, image_bytes, mime_type, system_instruction, json_mode)
            if res and res.strip():
                if json_mode:
                    # Validate JSON
                    json.loads(clean_json_markdown(res))
                print(f"[Gemini SDK Raw Response ({len(res)} chars)] {res.strip()}", flush=True)
                return res, False
        except Exception as e_sdk:
            print(f"[Gemini SDK Attempt {attempt + 1} Warning] {type(e_sdk).__name__}: {e_sdk}", flush=True)
            # 2. Try REST fallback
            try:
                res = _call_gemini_rest(prompt, image_bytes, mime_type, system_instruction, json_mode)
                if res and res.strip():
                    if json_mode:
                        json.loads(clean_json_markdown(res))
                    print(f"[Gemini REST Raw Response ({len(res)} chars)] {res.strip()}", flush=True)
                    return res, False
            except Exception as e_rest:
                print(f"[Gemini REST Attempt {attempt + 1} Warning] {type(e_rest).__name__}: {e_rest}", flush=True)
                if attempt < retries:
                    time.sleep(1.0)
                    continue

    print("[Gemini Fallback Triggered] SDK and REST calls both failed or returned invalid response.", flush=True)
    # Graceful fallback if both fail
    return "", True

def clean_json_markdown(text: str) -> str:
    """Strips markdown code fences (```json ... ```) from LLM output."""
    t = text.strip()
    if t.startswith("```json"):
        t = t[7:]
    elif t.startswith("```"):
        t = t[3:]
    if t.endswith("```"):
        t = t[:-3]
    return t.strip()

_EMB_CACHE: Dict[str, List[float]] = {}

def get_embedding(text: str) -> List[float]:
    """
    Computes embedding for text using GEMINI_EMBED_MODEL or fallback deterministic vector.
    Caches results in memory for sub-millisecond repeated queries.
    """
    text = text.strip()
    if not text:
        return [0.0] * 3072

    if text in _EMB_CACHE:
        return _EMB_CACHE[text]

    # Try SDK first
    if _genai_client and GEMINI_API_KEY:
        try:
            resp = _genai_client.models.embed_content(
                model=GEMINI_EMBED_MODEL,
                contents=text
            )
            if hasattr(resp, "embedding") and resp.embedding:
                values = resp.embedding.values
                if values:
                    res_list = list(values)
                    _EMB_CACHE[text] = res_list
                    return res_list
            if hasattr(resp, "embeddings") and resp.embeddings:
                res_list = list(resp.embeddings[0].values)
                _EMB_CACHE[text] = res_list
                return res_list
        except Exception:
            pass

    # Try REST
    if GEMINI_API_KEY:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_EMBED_MODEL}:embedContent"
            headers = {"x-goog-api-key": GEMINI_API_KEY}
            params = {"key": GEMINI_API_KEY}
            body = {
                "model": f"models/{GEMINI_EMBED_MODEL}",
                "content": {"parts": [{"text": text}]}
            }
            res = requests.post(url, headers=headers, params=params, json=body, timeout=15)
            if res.status_code == 200:
                data = res.json()
                emb = data.get("embedding", {}).get("values", [])
                if emb:
                    return emb
        except Exception:
            pass

    # Deterministic semantic-like feature vector fallback (3072-dim to match Gemini embed model)
    # Ensures RAG / ChromaDB always works reliably without quota blocks
    dim = 3072
    vector = [0.0] * dim
    words = text.lower().split()
    for i, word in enumerate(words):
        h = int(hashlib.sha256(word.encode("utf-8")).hexdigest(), 16)
        idx = h % dim
        vector[idx] += 1.0 / (1.0 + (i * 0.1))

    # Normalize vector to unit length
    norm = sum(x * x for x in vector) ** 0.5
    if norm > 0:
        vector = [x / norm for x in vector]
    return vector
