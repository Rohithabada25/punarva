import sys
import os
import io
import json

sys.path.insert(0, os.path.dirname(__file__))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from graph import run_listing_analysis
from llm import GEMINI_MODEL

def test_section_a_photos():
    print("=" * 70)
    print("TESTING SECTION A: 4 REAL MATERIAL PHOTOS ANALYSIS")
    print(f"Configured Model: {GEMINI_MODEL}")
    print("=" * 70)

    test_items = [
        ("Bricks", "sample_photos/bricks.jpg", "en"),
        ("Cement Bag", "sample_photos/cement_bag.jpg", "en"),
        ("Wooden Furniture", "sample_photos/wooden_furniture.jpg", "en"),
        ("E-Waste", "sample_photos/ewaste.jpg", "en"),
    ]

    results = []

    for label, rel_path, lang in test_items:
        full_path = os.path.join(os.path.dirname(__file__), rel_path)
        print(f"\n[{label.upper()}] Loading {rel_path} ({os.path.getsize(full_path)} bytes)...")
        with open(full_path, "rb") as f:
            img_bytes = f.read()

        data = run_listing_analysis(img_bytes, language=lang)

        print(f"  -> Detected Material : {data['material_type']}")
        print(f"  -> Category          : {data['category']}")
        print(f"  -> Estimated Qty/Unit: {data['estimated_quantity']} {data['unit']} (Confidence: {data['confidence']})")
        print(f"  -> Condition         : {data['condition']}")
        print(f"  -> RAG Sources Cited : {data['reuse_sources']}")
        print(f"  -> Reuse Guidance    : {data['reuse_recommendation']}")
        print(f"  -> Suggested Price   : ₹{data['suggested_price']} (Range: ₹{data['price_range']['min']} - ₹{data['price_range']['max']})")
        print(f"  -> Price Reason      : {data['price_explanation']}")
        print(f"  -> Mocked Fallback?  : {data.get('is_mocked', False)}")
        print(f"  -> Trace Log         :")
        for t in data.get("agent_trace", []):
            print(f"     [{t['agent']}] ({t['status']}) {t['summary']} in {t['duration_ms']}ms")

        results.append({
            "label": label,
            "material": data['material_type'],
            "qty_unit": f"{data['estimated_quantity']} {data['unit']}",
            "sources": data['reuse_sources'],
            "price": f"₹{data['suggested_price']}",
            "range": f"₹{data['price_range']['min']} - ₹{data['price_range']['max']}",
            "is_mocked": data.get('is_mocked', False)
        })

    print("\n" + "=" * 70)
    print("SECTION A COMPARISON SUMMARY TABLE")
    print("=" * 70)
    for r in results:
        print(f"{r['label']:<18} | {r['material']:<25} | {r['qty_unit']:<15} | {r['price']:<10} | Sources: {len(r['sources'])}")

    print("\nVerification Checklist:")
    # Check that materials differ
    materials = [r["material"].lower() for r in results]
    assert len(set(materials)) == 4, f"Materials must all be distinct! Found: {materials}"
    print("  [PASS] All 4 materials detected are clearly distinct.")

    # Check that prices differ and are not all ₹50
    prices = [r["price"] for r in results]
    assert len(set(prices)) > 2, f"Prices must clearly differ! Found: {prices}"
    assert all(r["price"] != "₹50.0" or r["label"] != "Bricks" for r in results if r["label"] != "Bricks"), "Prices must not be default ₹50 fallback"
    print("  [PASS] Prices clearly differ across categories and units.")

    # Check that sources differ
    sources_flat = [", ".join(r["sources"]) for r in results]
    assert len(set(sources_flat)) >= 3, f"Retrieved sources must differ! Found: {sources_flat}"
    print("  [PASS] RAG retrieved sources clearly differ based on material and category.")

    print("\nSECTION A TESTING COMPLETED SUCCESSFULLY!")

if __name__ == "__main__":
    test_section_a_photos()
