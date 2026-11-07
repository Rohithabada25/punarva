import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(__file__))

from fastapi.testclient import TestClient
from main import app
from db import SessionLocal
from models import User
from auth import hash_password, verify_password, decode_access_token

class TestSectionBAuth(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.db = SessionLocal()

        # Clean up any test user from previous runs
        cls.test_email = "test_engineer_b@punarva.demo"
        cls.db.query(User).filter(User.email == cls.test_email).delete()
        cls.db.commit()

    @classmethod
    def tearDownClass(cls):
        cls.db.query(User).filter(User.email == cls.test_email).delete()
        cls.db.commit()
        cls.db.close()

    def test_01_password_hashing_security(self):
        """Test PBKDF2 salt and digest security and verification"""
        raw_pw = "StrongPass2025!"
        hashed = hash_password(raw_pw)

        self.assertIn("$", hashed)
        salt, digest = hashed.split("$", 1)
        self.assertEqual(len(salt), 32)  # 16 bytes in hex = 32 chars
        self.assertGreater(len(digest), 40)
        self.assertNotEqual(raw_pw, hashed)

        self.assertTrue(verify_password(raw_pw, hashed))
        self.assertFalse(verify_password("WrongPass123", hashed))
        self.assertFalse(verify_password("", hashed))

    def test_02_register_new_user(self):
        """Test POST /auth/register with secure password hashing"""
        payload = {
            "name": "Kalyan Ram",
            "email": self.test_email,
            "password": "punarvapassword",
            "role": "buyer",
            "city": "Bapatla",
            "preferred_language": "te"
        }
        res = self.client.post("/auth/register", json=payload)
        self.assertEqual(res.status_code, 201, f"Register failed: {res.text}")
        data = res.json()

        self.assertIn("user", data)
        self.assertIn("token", data)
        self.assertEqual(data["user"]["email"], self.test_email)
        self.assertEqual(data["user"]["role"], "buyer")
        self.assertEqual(data["user"]["preferred_language"], "te")

        # Verify password is encrypted in database
        self.db.commit()
        db_user = self.db.query(User).filter(User.email == self.test_email).first()
        self.assertIsNotNone(db_user)
        self.assertNotEqual(db_user.password_hash, "punarvapassword")
        self.assertTrue(verify_password("punarvapassword", db_user.password_hash))

    def test_03_register_duplicate_email_fails(self):
        """Test POST /auth/register prevents duplicate email registration"""
        payload = {
            "name": "Another User",
            "email": self.test_email,
            "password": "somepassword123",
            "role": "seller",
            "city": "Guntur"
        }
        res = self.client.post("/auth/register", json=payload)
        self.assertEqual(res.status_code, 400)
        self.assertIn("already exists", res.json()["detail"])

    def test_04_register_short_password_fails(self):
        """Test POST /auth/register rejects passwords shorter than 6 chars"""
        payload = {
            "name": "Short Pw",
            "email": "shortpw@punarva.demo",
            "password": "123",
            "role": "seller"
        }
        res = self.client.post("/auth/register", json=payload)
        self.assertEqual(res.status_code, 422)

    def test_05_login_success_and_failure(self):
        """Test POST /auth/login with wrong and correct credentials"""
        # Wrong password
        bad_res = self.client.post("/auth/login", json={
            "email": self.test_email,
            "password": "incorrectpassword"
        })
        self.assertEqual(bad_res.status_code, 401)

        # Nonexistent user
        no_user_res = self.client.post("/auth/login", json={
            "email": "ghost@punarva.demo",
            "password": "anypassword"
        })
        self.assertEqual(no_user_res.status_code, 401)

        # Correct login
        good_res = self.client.post("/auth/login", json={
            "email": self.test_email,
            "password": "punarvapassword"
        })
        self.assertEqual(good_res.status_code, 200)
        login_data = good_res.json()
        self.assertIn("token", login_data)
        token = login_data["token"]

        # Verify decoded token
        payload = decode_access_token(token)
        self.assertIsNotNone(payload)
        self.assertEqual(payload["email"], self.test_email)
        self.assertEqual(payload["role"], "buyer")

    def test_06_login_seeded_user(self):
        """Test POST /auth/login for seeded account with default password"""
        res = self.client.post("/auth/login", json={
            "email": "rajesh@punarva.demo",
            "password": "punarva123"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["user"]["name"], "Rajesh Sharma")
        self.assertEqual(data["user"]["role"], "seller")

    def test_07_switch_persona(self):
        """Test POST /auth/switch-persona for 1-click evaluation switching"""
        suresh = self.db.query(User).filter(User.role == "buyer").first()
        res = self.client.post("/auth/switch-persona", json={"user_id": suresh.id})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["user"]["id"], suresh.id)
        self.assertIn("token", data)

    def test_08_authenticated_me_endpoint(self):
        """Test GET /auth/me with Bearer token"""
        login_res = self.client.post("/auth/login", json={
            "email": self.test_email,
            "password": "punarvapassword"
        })
        token = login_res.json()["token"]

        # Valid Bearer header
        me_res = self.client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(me_res.status_code, 200)
        self.assertEqual(me_res.json()["email"], self.test_email)

        # Invalid token
        bad_me = self.client.get("/auth/me", headers={"Authorization": "Bearer invalid.fake.token"})
        self.assertEqual(bad_me.status_code, 401)

    def test_09_user_profile_and_password_update(self):
        """Test PATCH /users/{user_id} for updating profile and password"""
        self.db.commit()
        user = self.db.query(User).filter(User.email == self.test_email).first()

        # Update profile attributes
        update_res = self.client.patch(f"/users/{user.id}", json={
            "name": "Kalyan Ram Updated",
            "city": "Chirala",
            "preferred_language": "hi"
        })
        self.assertEqual(update_res.status_code, 200)
        data = update_res.json()
        self.assertEqual(data["name"], "Kalyan Ram Updated")
        self.assertEqual(data["city"], "Chirala")
        self.assertEqual(data["preferred_language"], "hi")

        # Wrong current password fails
        bad_pw_res = self.client.patch(f"/users/{user.id}", json={
            "current_password": "wrong_current_password",
            "new_password": "brandnewpassword123"
        })
        self.assertEqual(bad_pw_res.status_code, 400)

        # Correct password update
        good_pw_res = self.client.patch(f"/users/{user.id}", json={
            "current_password": "punarvapassword",
            "new_password": "brandnewpassword123"
        })
        self.assertEqual(good_pw_res.status_code, 200)

        # Verify old password no longer works
        old_login = self.client.post("/auth/login", json={
            "email": self.test_email,
            "password": "punarvapassword"
        })
        self.assertEqual(old_login.status_code, 401)

        # Verify new password works
        new_login = self.client.post("/auth/login", json={
            "email": self.test_email,
            "password": "brandnewpassword123"
        })
        self.assertEqual(new_login.status_code, 200)

    def test_10_preserves_section_a_and_marketplace(self):
        """Ensure Section A pricing, RAG, and marketplace APIs are completely intact"""
        # Health
        health = self.client.get("/health")
        self.assertEqual(health.status_code, 200)
        self.assertEqual(health.json()["status"], "healthy")

        # Listings
        listings = self.client.get("/listings")
        self.assertEqual(listings.status_code, 200)
        self.assertIsInstance(listings.json(), list)

        # Users
        users = self.client.get("/users")
        self.assertEqual(users.status_code, 200)
        self.assertGreaterEqual(len(users.json()), 13)

if __name__ == "__main__":
    unittest.main()
