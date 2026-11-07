import os
from typing import List, Dict, Any, Optional
import chromadb
from dotenv import load_dotenv

dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
load_dotenv(dotenv_path=dotenv_path, override=False)

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from llm import get_embedding
from rag.knowledge import REUSE_GUIDES, MATERIAL_STANDARDS, RECYCLER_DIRECTORY

CHROMA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "chroma_db")

_chroma_client = None

def get_chroma_client():
    global _chroma_client
    if _chroma_client is None:
        _chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
    return _chroma_client

def retrieve_reuse_guides(query: str, top_k: int = 4, relevance_threshold: float = 0.38) -> List[Dict[str, Any]]:
    """Retrieves most relevant reuse guides from ChromaDB with distance threshold and keyword fallback."""
    try:
        client = get_chroma_client()
        col = client.get_collection("reuse_guides")
        emb = get_embedding(query)
        res = col.query(query_embeddings=[emb], n_results=min(top_k * 2, col.count()))
        results = []
        if res and res["documents"] and len(res["documents"][0]) > 0:
            distances = res.get("distances", [[]])[0] if res.get("distances") else [0.0] * len(res["documents"][0])
            for i in range(len(res["documents"][0])):
                dist = distances[i] if i < len(distances) else 0.0
                if dist <= relevance_threshold:
                    results.append({
                        "id": res["ids"][0][i],
                        "title": res["metadatas"][0][i].get("title", ""),
                        "category": res["metadatas"][0][i].get("category", ""),
                        "material": res["metadatas"][0][i].get("material", ""),
                        "document": res["documents"][0][i],
                        "distance": dist
                    })
                if len(results) >= top_k:
                    break
            if results:
                return results
    except Exception as e:
        pass

    # In-memory keyword match fallback with strict relevance threshold
    q_lower = query.lower()
    matches = []
    for g in REUSE_GUIDES:
        score = 0
        mat = g["material"].lower()
        cat = g["category"].lower()
        if mat in q_lower or any(word in q_lower for word in mat.split() if len(word) > 3):
            score += 4
        if cat in q_lower:
            score += 2
        for t in g.get("tags", []):
            if t in q_lower:
                score += 1
        if score >= 2:
            matches.append((score, g))
    matches.sort(key=lambda x: x[0], reverse=True)
    if matches:
        return [{"id": m[1]["id"], "title": m[1]["title"], "category": m[1]["category"], "material": m[1]["material"], "document": m[1]["content"]} for m in matches[:top_k]]
    return []

def retrieve_material_standards(query: str, top_k: int = 4, relevance_threshold: float = 0.38) -> List[Dict[str, Any]]:
    """Retrieves relevant IS/CPWD standards from ChromaDB with distance threshold."""
    try:
        client = get_chroma_client()
        col = client.get_collection("material_standards")
        emb = get_embedding(query)
        res = col.query(query_embeddings=[emb], n_results=min(top_k * 2, col.count()))
        results = []
        if res and res["documents"] and len(res["documents"][0]) > 0:
            distances = res.get("distances", [[]])[0] if res.get("distances") else [0.0] * len(res["documents"][0])
            for i in range(len(res["documents"][0])):
                dist = distances[i] if i < len(distances) else 0.0
                if dist <= relevance_threshold:
                    results.append({
                        "id": res["ids"][0][i],
                        "title": res["metadatas"][0][i].get("title", ""),
                        "standard_code": res["metadatas"][0][i].get("standard_code", ""),
                        "document": res["documents"][0][i],
                        "distance": dist
                    })
                if len(results) >= top_k:
                    break
            if results:
                return results
    except Exception:
        pass

    # In-memory fallback with strict relevance
    q_lower = query.lower()
    matches = []
    for s in MATERIAL_STANDARDS:
        score = 0
        cat = s["category"].lower()
        title = s["title"].lower()
        if any(w in q_lower for w in title.split() if len(w) > 4):
            score += 3
        if cat in q_lower:
            score += 2
        if score >= 2:
            matches.append((score, s))
    matches.sort(key=lambda x: x[0], reverse=True)
    if matches:
        return [{"id": m[1]["id"], "title": m[1]["title"], "standard_code": m[1]["standard_code"], "document": m[1]["content"]} for m in matches[:top_k]]
    return []

def retrieve_recyclers(query: str, top_k: int = 3, category: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieves local recyclers or donation depots from ChromaDB."""
    try:
        client = get_chroma_client()
        col = client.get_collection("recycler_directory")
        emb = get_embedding(query)
        res = col.query(query_embeddings=[emb], n_results=min(top_k, col.count()))
        results = []
        if res and res["documents"] and len(res["documents"][0]) > 0:
            for i in range(len(res["documents"][0])):
                results.append({
                    "id": res["ids"][0][i],
                    "name": res["metadatas"][0][i].get("name", ""),
                    "type": res["metadatas"][0][i].get("type", ""),
                    "city": res["metadatas"][0][i].get("city", ""),
                    "address": res["metadatas"][0][i].get("address", ""),
                    "contact": res["metadatas"][0][i].get("contact", ""),
                    "notes": res["metadatas"][0][i].get("notes", "")
                })
            return results
    except Exception:
        pass

    # In-memory fallback
    matches = []
    for r in RECYCLER_DIRECTORY:
        score = 0
        if category and r["category"].lower() == category.lower():
            score += 3
        if r["city"].lower() in query.lower():
            score += 2
        for m in r["materials"]:
            if m.lower() in query.lower():
                score += 2
        matches.append((score, r))
    matches.sort(key=lambda x: x[0], reverse=True)
    return [{"id": m[1]["id"], "name": m[1]["name"], "type": m[1]["type"], "city": m[1]["city"], "address": m[1]["address"], "contact": m[1]["contact"], "notes": m[1]["notes"]} for m in matches[:top_k]]
