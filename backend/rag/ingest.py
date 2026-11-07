import os
import chromadb
from dotenv import load_dotenv

dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
load_dotenv(dotenv_path=dotenv_path, override=False)

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from llm import get_embedding
from rag.knowledge import REUSE_GUIDES, MATERIAL_STANDARDS, RECYCLER_DIRECTORY

CHROMA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "chroma_db")

def ingest_all():
    print(f"Initializing ChromaDB in {CHROMA_PATH}...")
    client = chromadb.PersistentClient(path=CHROMA_PATH)

    # 1. Reuse Guides Collection
    print("Ingesting reuse_guides collection...")
    try:
        client.delete_collection("reuse_guides")
    except Exception:
        pass
    col_guides = client.create_collection(name="reuse_guides", metadata={"hnsw:space": "cosine"})

    guide_ids = []
    guide_texts = []
    guide_metas = []
    guide_embs = []

    for i, item in enumerate(REUSE_GUIDES):
        doc = f"{item['title']}. Material: {item['material']} ({item['category']}). {item['content']}"
        guide_ids.append(item["id"])
        guide_texts.append(doc)
        guide_metas.append({
            "title": item["title"],
            "category": item["category"],
            "material": item["material"],
            "tags": ", ".join(item.get("tags", []))
        })
        print(f"  Embedding guide {i+1}/{len(REUSE_GUIDES)}: {item['title'][:30]}...", flush=True)
        guide_embs.append(get_embedding(doc))

    col_guides.add(
        ids=guide_ids,
        documents=guide_texts,
        metadatas=guide_metas,
        embeddings=guide_embs
    )
    print(f"  Added {len(guide_ids)} reuse guides.")

    # 2. Material Standards Collection
    print("Ingesting material_standards collection...")
    try:
        client.delete_collection("material_standards")
    except Exception:
        pass
    col_standards = client.create_collection(name="material_standards", metadata={"hnsw:space": "cosine"})

    std_ids = []
    std_texts = []
    std_metas = []
    std_embs = []

    for item in MATERIAL_STANDARDS:
        doc = f"{item['title']} [{item['standard_code']}]. {item['content']}"
        std_ids.append(item["id"])
        std_texts.append(doc)
        std_metas.append({
            "title": item["title"],
            "category": item["category"],
            "standard_code": item["standard_code"]
        })
        std_embs.append(get_embedding(doc))

    col_standards.add(
        ids=std_ids,
        documents=std_texts,
        metadatas=std_metas,
        embeddings=std_embs
    )
    print(f"  Added {len(std_ids)} material standards.")

    # 3. Recycler Directory Collection
    print("Ingesting recycler_directory collection...")
    try:
        client.delete_collection("recycler_directory")
    except Exception:
        pass
    col_recyclers = client.create_collection(name="recycler_directory", metadata={"hnsw:space": "cosine"})

    rec_ids = []
    rec_texts = []
    rec_metas = []
    rec_embs = []

    for item in RECYCLER_DIRECTORY:
        doc = f"{item['name']} ({item['type']}) in {item['city']}. Materials: {', '.join(item['materials'])}. {item['notes']}. Address: {item['address']}"
        rec_ids.append(item["id"])
        rec_texts.append(doc)
        rec_metas.append({
            "name": item["name"],
            "type": item["type"],
            "city": item["city"],
            "category": item["category"],
            "address": item["address"],
            "contact": item["contact"],
            "notes": item["notes"]
        })
        rec_embs.append(get_embedding(doc))

    col_recyclers.add(
        ids=rec_ids,
        documents=rec_texts,
        metadatas=rec_metas,
        embeddings=rec_embs
    )
    print(f"  Added {len(rec_ids)} recycler and donation targets.")
    print("ChromaDB ingestion completed successfully!")

if __name__ == "__main__":
    ingest_all()
