"""
Section E: Modals, Esc Key, Outside Click & Accessibility Verification Suite for Punarva.
Tests:
1. CertificateModal: Esc key, outside click, stopPropagation, scroll lock, aria labels.
2. DisputeModal: Esc key, outside click, stopPropagation, scroll lock, aria labels.
3. BrowsePage Offer Modal: Esc key, outside click, stopPropagation, scroll lock, aria labels.
4. Navbar Dropdowns & Popovers: Esc key dismissal, outside click on langRef/userRef/notifRef, aria attributes.
"""

import os
import sys
import unittest

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_SRC = os.path.join(ROOT_DIR, "frontend", "src")

class TestSectionEClosing(unittest.TestCase):

    def test_01_certificate_modal_closing_and_accessibility(self):
        filepath = os.path.join(FRONTEND_SRC, "components", "CertificateModal.jsx")
        self.assertTrue(os.path.exists(filepath), f"Missing {filepath}")
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        # 1. Escape key handler
        self.assertIn("e.key === 'Escape'", content, "CertificateModal must handle Escape key")
        self.assertIn("window.addEventListener('keydown'", content, "Must add keydown listener")
        self.assertIn("window.removeEventListener('keydown'", content, "Must clean up keydown listener")

        # 2. Outside click dismissal
        self.assertIn("onClick={onClose}", content, "Backdrop must trigger onClose on click")

        # 3. Prevent accidental closing when clicking inside
        self.assertIn("e.stopPropagation()", content, "Inner dialog must stop click propagation")

        # 4. Accessible close button with aria-label
        self.assertIn("aria-label=\"Close certificate modal\"", content, "Close button must have aria-label")

        # 5. Background scrolling prevention
        self.assertIn("document.body.style.overflow = 'hidden'", content, "Must lock background scroll when open")
        self.assertIn("document.body.style.overflow = originalOverflow", content, "Must restore background scroll on close")

        # 6. ARIA dialog attributes & focus
        self.assertIn("role=\"dialog\"", content, "Must specify role='dialog'")
        self.assertIn("aria-modal=\"true\"", content, "Must specify aria-modal='true'")
        self.assertIn("aria-labelledby=\"certificate-title\"", content, "Must link aria-labelledby to title")
        print("[PASS] CertificateModal implements Escape key, outside click, stopPropagation, scroll lock, and accessible attributes.")

    def test_02_dispute_modal_closing_and_accessibility(self):
        filepath = os.path.join(FRONTEND_SRC, "components", "DisputeModal.jsx")
        self.assertTrue(os.path.exists(filepath), f"Missing {filepath}")
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        # 1. Escape key handler
        self.assertIn("e.key === 'Escape'", content, "DisputeModal must handle Escape key")
        self.assertIn("window.addEventListener('keydown'", content, "Must add keydown listener")
        self.assertIn("window.removeEventListener('keydown'", content, "Must clean up keydown listener")

        # 2. Outside click dismissal
        self.assertIn("onClick={onClose}", content, "Backdrop must trigger onClose on click")

        # 3. Prevent accidental closing when clicking inside
        self.assertIn("e.stopPropagation()", content, "Inner dialog must stop click propagation")

        # 4. Accessible close button with aria-label
        self.assertIn("aria-label=\"Close dispute modal\"", content, "Close button must have aria-label")

        # 5. Background scrolling prevention
        self.assertIn("document.body.style.overflow = 'hidden'", content, "Must lock background scroll when open")
        self.assertIn("document.body.style.overflow = originalOverflow", content, "Must restore background scroll on close")

        # 6. ARIA dialog attributes
        self.assertIn("role=\"dialog\"", content, "Must specify role='dialog'")
        self.assertIn("aria-modal=\"true\"", content, "Must specify aria-modal='true'")
        self.assertIn("aria-labelledby=\"dispute-modal-title\"", content, "Must link aria-labelledby to title")
        print("[PASS] DisputeModal implements Escape key, outside click, stopPropagation, scroll lock, and accessible attributes.")

    def test_03_browse_offer_modal_closing_and_accessibility(self):
        filepath = os.path.join(FRONTEND_SRC, "pages", "BrowsePage.jsx")
        self.assertTrue(os.path.exists(filepath), f"Missing {filepath}")
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        # 1. Escape key handler
        self.assertIn("e.key === 'Escape'", content, "BrowsePage offer modal must handle Escape key")
        self.assertIn("setOfferModalOpen(false)", content, "Must close offer modal on Escape")

        # 2. Outside click dismissal
        self.assertIn("onClick={() => setOfferModalOpen(false)}", content, "Backdrop must trigger close on click")

        # 3. Prevent accidental closing when clicking inside
        self.assertIn("e.stopPropagation()", content, "Inner dialog must stop click propagation")

        # 4. Accessible close button with aria-label
        self.assertIn("aria-label=\"Close offer modal\"", content, "Close button must have aria-label")

        # 5. Background scrolling prevention
        self.assertIn("document.body.style.overflow = 'hidden'", content, "Must lock background scroll when open")

        # 6. ARIA dialog attributes
        self.assertIn("role=\"dialog\"", content, "Must specify role='dialog'")
        self.assertIn("aria-modal=\"true\"", content, "Must specify aria-modal='true'")
        self.assertIn("aria-labelledby=\"offer-modal-title\"", content, "Must link aria-labelledby to title")
        print("[PASS] BrowsePage Offer Modal implements Escape key, outside click, stopPropagation, scroll lock, and accessible attributes.")

    def test_04_navbar_dropdowns_and_popovers_closing(self):
        filepath = os.path.join(FRONTEND_SRC, "components", "Navbar.jsx")
        self.assertTrue(os.path.exists(filepath), f"Missing {filepath}")
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        # 1. Escape key dismissal for all menus
        self.assertIn("e.key === 'Escape'", content, "Navbar must handle Escape key")
        self.assertIn("setNotifPanelOpen(false)", content, "Escape must close notification panel")
        self.assertIn("setUserMenuOpen(false)", content, "Escape must close user menu")
        self.assertIn("setLangMenuOpen(false)", content, "Escape must close language menu")
        self.assertIn("setMobileMenuOpen(false)", content, "Escape must close mobile menu")

        # 2. Outside click handlers with refs
        self.assertIn("notifRef.current && !notifRef.current.contains(e.target)", content, "Must dismiss notif on outside click")
        self.assertIn("langRef.current && !langRef.current.contains(e.target)", content, "Must dismiss lang on outside click")
        self.assertIn("userRef.current && !userRef.current.contains(e.target)", content, "Must dismiss user on outside click")

        # 3. Closable notification panel close button
        self.assertIn("aria-label=\"Close notification panel\"", content, "Notif panel must have accessible close button")

        # 4. Accessible popover & dropdown triggers
        self.assertIn("aria-haspopup=\"dialog\"", content, "Notif trigger must specify aria-haspopup")
        self.assertIn("aria-expanded={notifPanelOpen}", content, "Notif trigger must track aria-expanded")
        self.assertIn("aria-expanded={langMenuOpen}", content, "Lang trigger must track aria-expanded")
        self.assertIn("aria-expanded={userMenuOpen}", content, "User trigger must track aria-expanded")
        print("[PASS] Navbar dropdowns and popovers implement full Escape, outside click, and ARIA state management.")

if __name__ == "__main__":
    unittest.main()
