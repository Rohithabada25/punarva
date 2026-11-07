import os
import sys
import json
import re
import unittest

sys.path.insert(0, os.path.dirname(__file__))

from fastapi.testclient import TestClient
from main import app

def hex_to_relative_luminance(hex_code: str) -> float:
    """Calculates relative luminance according to W3C WCAG 2.1 specs."""
    hex_code = hex_code.lstrip("#")
    r, g, b = [int(hex_code[i:i+2], 16) / 255.0 for i in (0, 2, 4)]

    def channel_luminance(c):
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4

    return 0.2126 * channel_luminance(r) + 0.7152 * channel_luminance(g) + 0.0722 * channel_luminance(b)

def contrast_ratio(hex1: str, hex2: str) -> float:
    """Computes contrast ratio (L1 + 0.05) / (L2 + 0.05) between two hex colors."""
    l1 = hex_to_relative_luminance(hex1)
    l2 = hex_to_relative_luminance(hex2)
    lighter = max(l1, l2)
    darker = min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)


class TestSectionCVisibility(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "src")

    def test_01_wcag_contrast_ratios_dashboard_cta(self):
        """Verify that all dashboard CTA card color combinations exceed WCAG 4.5:1"""
        # Sell / Donate Card: Emerald-800 (#166534) to Emerald-950 (#052e16)
        white = "#ffffff"
        emerald_800 = "#166534"
        emerald_950 = "#052e16"
        emerald_100 = "#dcfce7"
        emerald_300 = "#86efac"

        cr_sell_title_800 = contrast_ratio(white, emerald_800)
        cr_sell_title_950 = contrast_ratio(white, emerald_950)
        cr_sell_subtitle_800 = contrast_ratio(emerald_100, emerald_800)
        cr_sell_badge = contrast_ratio(emerald_950, emerald_300)

        self.assertGreaterEqual(cr_sell_title_800, 4.5, f"Contrast {cr_sell_title_800:.2f} < 4.5:1")
        self.assertGreaterEqual(cr_sell_title_950, 4.5, f"Contrast {cr_sell_title_950:.2f} < 4.5:1")
        self.assertGreaterEqual(cr_sell_subtitle_800, 4.5, f"Contrast {cr_sell_subtitle_800:.2f} < 4.5:1")
        self.assertGreaterEqual(cr_sell_badge, 4.5, f"Contrast {cr_sell_badge:.2f} < 4.5:1")

        # Find Material Card: Blue-900 (#1e3a8a) to Slate-950 (#020617)
        blue_900 = "#1e3a8a"
        slate_950 = "#020617"
        blue_100 = "#dbeafe"
        blue_300 = "#93c5fd"
        blue_950 = "#172554"

        cr_find_title_900 = contrast_ratio(white, blue_900)
        cr_find_title_950 = contrast_ratio(white, slate_950)
        cr_find_subtitle_900 = contrast_ratio(blue_100, blue_900)
        cr_find_badge = contrast_ratio(blue_950, blue_300)

        self.assertGreaterEqual(cr_find_title_900, 4.5, f"Contrast {cr_find_title_900:.2f} < 4.5:1")
        self.assertGreaterEqual(cr_find_title_950, 4.5, f"Contrast {cr_find_title_950:.2f} < 4.5:1")
        self.assertGreaterEqual(cr_find_subtitle_900, 4.5, f"Contrast {cr_find_subtitle_900:.2f} < 4.5:1")
        self.assertGreaterEqual(cr_find_badge, 4.5, f"Contrast {cr_find_badge:.2f} < 4.5:1")

        # General text on light background (Slate-600/700 on white)
        slate_600 = "#475569"
        slate_700 = "#334155"
        cr_slate_600 = contrast_ratio(slate_600, white)
        cr_slate_700 = contrast_ratio(slate_700, white)

        self.assertGreaterEqual(cr_slate_600, 4.5, f"Contrast {cr_slate_600:.2f} < 4.5:1")
        self.assertGreaterEqual(cr_slate_700, 4.5, f"Contrast {cr_slate_700:.2f} < 4.5:1")

    def test_02_no_invalid_bg_linear_syntax(self):
        """Ensure no invalid 'bg-linear' classes exist in the JSX files"""
        jsx_files = []
        for root, _, files in os.walk(self.frontend_dir):
            for file in files:
                if file.endswith(".jsx"):
                    jsx_files.append(os.path.join(root, file))

        for file_path in jsx_files:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
                matches = re.findall(r"bg-linear-to-[a-z]+", content)
                self.assertEqual(len(matches), 0, f"Found invalid bg-linear in {file_path}: {matches}")

    def test_03_translations_consistency_en_te_hi(self):
        """Verify that English, Telugu, and Hindi translation files contain all essential keys"""
        locales_dir = os.path.join(self.frontend_dir, "locales")
        with open(os.path.join(locales_dir, "en.json"), "r", encoding="utf-8") as f:
            en = json.load(f)
        with open(os.path.join(locales_dir, "te.json"), "r", encoding="utf-8") as f:
            te = json.load(f)
        with open(os.path.join(locales_dir, "hi.json"), "r", encoding="utf-8") as f:
            hi = json.load(f)

        required_sections = ["brand", "nav", "login", "dashboard", "upload", "browse"]
        for section in required_sections:
            self.assertIn(section, en)
            self.assertIn(section, te)
            self.assertIn(section, hi)

        # Check critical CTA keys
        self.assertIn("cta_sell", en["dashboard"])
        self.assertIn("cta_sell", te["dashboard"])
        self.assertIn("cta_sell", hi["dashboard"])

        self.assertIn("cta_buy", en["dashboard"])
        self.assertIn("cta_buy", te["dashboard"])
        self.assertIn("cta_buy", hi["dashboard"])

    def test_04_api_regression_integrity(self):
        """Verify backend APIs remain healthy and unaffected"""
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "healthy")

        users_res = self.client.get("/users")
        self.assertEqual(users_res.status_code, 200)

        listings_res = self.client.get("/listings")
        self.assertEqual(listings_res.status_code, 200)

if __name__ == "__main__":
    unittest.main()
