import sys
import os
import json

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(__file__))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_pipeline():
    samples = [
        ("backend/sample_photos/sample_1_bricks.jpg", "en", "Sample 1: Clay Bricks (English)"),
        ("backend/sample_photos/sample_2_wood.jpg", "te", "Sample 2: Wood Planks (Telugu)"),
        ("backend/sample_photos/sample_3_tiles.jpg", "te", "Sample 3: Ceramic Tiles (Telugu)"),
    ]

    for path, lang, title in samples:
        print("=" * 65)
        print(f"RUNNING: {title} [Language: {lang}]")
        print("=" * 65)
        with open(path, "rb") as f:
            res = client.post(
                "/listings/analyze",
                files={"file": ("photo.jpg", f, "image/jpeg")},
                data={"language": lang}
            )

        print(f"Status Code: {res.status_code}")
        if res.status_code == 200:
            data = res.json()
            print(f"Material Type      : {data.get('material_type')}")
            print(f"Category           : {data.get('category')}")
            print(f"Estimated Quantity : {data.get('estimated_quantity')} {data.get('unit')} (AI PROBABLE ESTIMATE)")
            print(f"Confidence         : {data.get('confidence')}")
            print(f"Condition          : {data.get('condition')}")
            print(f"Hazard Flag / Note : {data.get('hazard_flag')} | {data.get('hazard_note')}")
            print(f"Suggested Price    : ₹{data.get('suggested_price')} (Range: ₹{data.get('price_range', {}).get('min')} - ₹{data.get('price_range', {}).get('max')})")
            print(f"Price Reason       : {data.get('price_explanation')}")
            print(f"Reuse Guidance     : {data.get('reuse_recommendation')}")
            print(f"Sources Cited      : {data.get('reuse_sources')}")
            print("Agent Execution Trace:")
            for trace in data.get("agent_trace", []):
                print(f"  [{trace['agent']}] ({trace['status']}) {trace['summary']} - {trace['duration_ms']}ms")
        else:
            print("ERROR response:", res.text)
        print()

if __name__ == "__main__":
    test_pipeline()
