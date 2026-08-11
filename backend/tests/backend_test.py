"""Regression tests for reviews, orders, products, authentication, uploads, and settings APIs."""
import os
import re
import uuid
from pathlib import Path
from urllib.parse import unquote

import pytest
import requests
from dotenv import dotenv_values
from pymongo import MongoClient

frontend_env = dotenv_values("/app/frontend/.env")
backend_env = dotenv_values("/app/backend/.env")
BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL", "")).rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL is required"


@pytest.fixture(scope="session")
def credentials():
    content = Path("/app/memory/test_credentials.md").read_text(encoding="utf-8")
    email = re.search(r"(?im)^- Email:\s*(\S+)", content)
    password = re.search(r"(?im)^- Password:\s*(\S+)", content)
    if not email or not password:
        pytest.skip("Admin credentials are absent from test_credentials.md")
    return {"email": email.group(1), "password": password.group(1)}


@pytest.fixture(scope="session")
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="session")
def authenticated_client(credentials):
    session = requests.Session()
    response = session.post(f"{BASE_URL}/api/auth/login", json=credentials, timeout=20)
    if response.status_code != 200:
        pytest.fail(f"Admin authentication failed: {response.status_code} {response.text[:300]}")
    assert response.json()["email"] == credentials["email"]
    return session


@pytest.fixture(scope="session")
def mongo_db():
    client = MongoClient(backend_env["MONGO_URL"])
    yield client[backend_env["DB_NAME"]]
    client.close()


class TestAuthAndSecurity:
    def test_login_sets_secure_httponly_cookies_and_me_works(self, credentials):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json=credentials, timeout=20)
        assert response.status_code == 200
        assert response.json()["role"] == "admin"
        cookies = response.headers.get("set-cookie", "").lower()
        assert "access_token=" in cookies and "refresh_token=" in cookies
        assert cookies.count("httponly") >= 2
        assert cookies.count("secure") >= 2
        me = session.get(f"{BASE_URL}/api/auth/me", timeout=20)
        assert me.status_code == 200
        assert me.json()["email"] == credentials["email"]

    def test_protected_endpoints_reject_anonymous(self):
        for method, path, body in [
            ("get", "/api/reviews/all", None),
            ("get", "/api/orders", None),
            ("put", "/api/orders/missing/status", {"status": "confirmed"}),
        ]:
            response = requests.request(method, f"{BASE_URL}{path}", json=body, timeout=20)
            assert response.status_code == 401, (path, response.status_code, response.text)
            assert response.json()["detail"] == "Not authenticated"

    def test_bcrypt_hash_and_indexes(self, mongo_db, credentials):
        user = mongo_db.users.find_one({"email": credentials["email"]})
        assert user and user["password_hash"].startswith("$2b$")
        assert mongo_db.users.index_information()["email_1"]["unique"] is True
        assert "identifier_1" in mongo_db.login_attempts.index_information()

    def test_brute_force_lockout_after_five_failures_is_email_scoped(self, mongo_db, credentials):
        email = f"test_lockout_{uuid.uuid4().hex}@example.test"
        mongo_db.login_attempts.delete_many({"identifier": email})
        statuses = []
        session = requests.Session()
        for _ in range(6):
            response = session.post(
                f"{BASE_URL}/api/auth/login",
                json={"email": email, "password": "definitely-wrong"},
                timeout=20,
            )
            statuses.append(response.status_code)
        try:
            assert statuses[:5] == [401] * 5
            assert statuses[5] == 429
            admin_login = requests.post(f"{BASE_URL}/api/auth/login", json=credentials, timeout=20)
            assert admin_login.status_code == 200
            assert admin_login.json()["email"] == credentials["email"]
        finally:
            mongo_db.login_attempts.delete_many({"identifier": email})


class TestReviews:
    def test_seeded_approved_reviews_are_public(self):
        response = requests.get(f"{BASE_URL}/api/reviews", timeout=20)
        assert response.status_code == 200
        data = response.json()
        names = {r["name"] for r in data}
        assert {"Ramesh Kumar", "Lakshmi Devi", "Suresh Reddy"}.issubset(names)
        assert all(r["approved"] is True for r in data)
        assert all(1 <= r["rating"] <= 5 for r in data)

    @pytest.mark.parametrize("payload", [
        {"name": "   ", "rating": 5, "text": "Valid text"},
        {"name": "TEST_Reviewer", "rating": 5, "text": "   "},
    ])
    def test_review_rejects_blank_name_or_text(self, payload):
        response = requests.post(f"{BASE_URL}/api/reviews", json=payload, timeout=20)
        assert response.status_code == 400
        assert "required" in response.json()["detail"].lower()

    @pytest.mark.parametrize("input_rating,expected", [(99, 5), (-4, 1)])
    def test_review_rating_is_clamped(self, authenticated_client, mongo_db, input_rating, expected):
        name = f"TEST_Clamp_{input_rating}"
        created = requests.post(
            f"{BASE_URL}/api/reviews",
            json={"name": name, "rating": input_rating, "text": "TEST_clamp validation"},
            timeout=20,
        )
        assert created.status_code == 201
        review_id = created.json()["id"]
        try:
            all_reviews = authenticated_client.get(f"{BASE_URL}/api/reviews/all", timeout=20)
            review = next(r for r in all_reviews.json() if r["id"] == review_id)
            assert review["rating"] == expected
            assert review["approved"] is False
        finally:
            authenticated_client.delete(f"{BASE_URL}/api/reviews/{review_id}", timeout=20)
            mongo_db.reviews.delete_one({"id": review_id})

    def test_review_create_approve_hide_delete_lifecycle(self, authenticated_client, mongo_db):
        name = "TEST_API_Review_Lifecycle"
        created = requests.post(
            f"{BASE_URL}/api/reviews",
            json={"name": name, "rating": 4, "text": "TEST_review lifecycle text"},
            timeout=20,
        )
        assert created.status_code == 201
        review_id = created.json()["id"]
        try:
            public = requests.get(f"{BASE_URL}/api/reviews", timeout=20).json()
            assert review_id not in {r["id"] for r in public}
            all_reviews = authenticated_client.get(f"{BASE_URL}/api/reviews/all", timeout=20)
            assert all_reviews.status_code == 200
            review = next(r for r in all_reviews.json() if r["id"] == review_id)
            assert review["name"] == name and review["approved"] is False

            approved = authenticated_client.put(
                f"{BASE_URL}/api/reviews/{review_id}/approve", json={"approved": True}, timeout=20
            )
            assert approved.status_code == 200 and approved.json() == {"ok": True}
            public_review = next(r for r in requests.get(f"{BASE_URL}/api/reviews", timeout=20).json() if r["id"] == review_id)
            assert public_review["approved"] is True

            hidden = authenticated_client.put(
                f"{BASE_URL}/api/reviews/{review_id}/approve", json={"approved": False}, timeout=20
            )
            assert hidden.status_code == 200
            assert review_id not in {r["id"] for r in requests.get(f"{BASE_URL}/api/reviews", timeout=20).json()}

            deleted = authenticated_client.delete(f"{BASE_URL}/api/reviews/{review_id}", timeout=20)
            assert deleted.status_code == 200 and deleted.json()["ok"] is True
            assert review_id not in {r["id"] for r in authenticated_client.get(f"{BASE_URL}/api/reviews/all", timeout=20).json()}
        finally:
            mongo_db.reviews.delete_one({"id": review_id})

    def test_public_review_upload_rejects_non_image_oversize_and_spoofed_mime(self, mongo_db):
        non_image = requests.post(
            f"{BASE_URL}/api/reviews/upload",
            files={"file": ("bad.txt", b"not an image", "text/plain")},
            timeout=30,
        )
        assert non_image.status_code == 400
        assert "image" in non_image.json()["detail"].lower()
        oversize = requests.post(
            f"{BASE_URL}/api/reviews/upload",
            files={"file": ("huge.png", b"0" * (5 * 1024 * 1024 + 1), "image/png")},
            timeout=30,
        )
        assert oversize.status_code == 400
        assert "5 mb" in oversize.json()["detail"].lower()

        spoofed = requests.post(
            f"{BASE_URL}/api/reviews/upload",
            files={"file": ("TEST_spoofed.png", b"not really a png", "image/png")},
            timeout=90,
        )
        try:
            assert spoofed.status_code == 400, spoofed.text
            assert spoofed.json()["detail"] == "Invalid image file"
        finally:
            if spoofed.status_code == 201:
                mongo_db.files.delete_one({"storage_path": spoofed.json().get("path")})

    def test_public_review_upload_accepts_image(self, mongo_db):
        # Complete 1x1 transparent PNG, not merely a MIME declaration or file signature.
        import base64
        payload = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
        )
        response = requests.post(
            f"{BASE_URL}/api/reviews/upload",
            files={"file": ("TEST_review.png", payload, "image/png")},
            timeout=90,
        )
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["url"].startswith("/api/files/")
        file_response = requests.get(f"{BASE_URL}{data['url']}", timeout=90)
        assert file_response.status_code == 200
        assert file_response.content == payload
        mongo_db.files.delete_one({"storage_path": data["path"]})


class TestOrders:
    def test_create_color_order_status_and_whatsapp(self, authenticated_client, mongo_db):
        payload = {
            "product_id": "TEST_product_id",
            "product_name": "TEST_Colour Sofa",
            "quantity": 2,
            "name": "TEST_Order_Customer",
            "phone": "9999999999",
            "address": "TEST_Address",
            "color": "Walnut Brown",
        }
        created = requests.post(f"{BASE_URL}/api/orders", json=payload, timeout=20)
        assert created.status_code == 201
        data = created.json()
        order_id = data["order_id"]
        try:
            assert "Colour%3A%20Walnut%20Brown" in data["wa_link"]
            assert "TEST_Colour%20Sofa" in data["wa_link"]
            orders = authenticated_client.get(f"{BASE_URL}/api/orders", timeout=20)
            assert orders.status_code == 200
            order = next(o for o in orders.json() if o["id"] == order_id)
            assert order["color"] == payload["color"]
            assert order["status"] == "pending"
            assert order["quantity"] == 2

            changed = authenticated_client.put(
                f"{BASE_URL}/api/orders/{order_id}/status", json={"status": "confirmed"}, timeout=20
            )
            assert changed.status_code == 200
            assert changed.json() == {"ok": True, "status": "confirmed"}
            persisted = next(o for o in authenticated_client.get(f"{BASE_URL}/api/orders", timeout=20).json() if o["id"] == order_id)
            assert persisted["status"] == "confirmed"

            invalid = authenticated_client.put(
                f"{BASE_URL}/api/orders/{order_id}/status", json={"status": "shipped"}, timeout=20
            )
            assert invalid.status_code == 400
            assert invalid.json()["detail"] == "Invalid status"
        finally:
            mongo_db.orders.delete_one({"id": order_id})


class TestProductsAndSettings:
    def test_all_seeded_products_have_colours(self):
        response = requests.get(f"{BASE_URL}/api/products", timeout=20)
        assert response.status_code == 200
        products = response.json()
        assert len(products) >= 12
        assert all(isinstance(p.get("colors"), list) and p["colors"] for p in products)
        assert all(isinstance(p.get("sold_out"), bool) for p in products)

    def test_admin_update_product_colors_and_sold_out_then_restore(self, authenticated_client):
        products = requests.get(f"{BASE_URL}/api/products", timeout=20).json()
        original = products[0]
        product_id = original["id"]
        payload = {k: original.get(k) for k in [
            "name", "category", "price", "mrp", "description", "image_url", "featured", "colors", "sold_out"
        ]}
        updated_payload = {**payload, "colors": ["TEST Navy", "TEST Cream"], "sold_out": True}
        try:
            response = authenticated_client.put(
                f"{BASE_URL}/api/products/{product_id}", json=updated_payload, timeout=20
            )
            assert response.status_code == 200
            assert response.json()["colors"] == updated_payload["colors"]
            assert response.json()["sold_out"] is True
            fetched = requests.get(f"{BASE_URL}/api/products/{product_id}", timeout=20)
            assert fetched.status_code == 200
            assert fetched.json()["colors"] == updated_payload["colors"]
            assert fetched.json()["sold_out"] is True
        finally:
            restored = authenticated_client.put(f"{BASE_URL}/api/products/{product_id}", json=payload, timeout=20)
            assert restored.status_code == 200
            assert restored.json()["colors"] == payload["colors"]
            assert restored.json()["sold_out"] == payload["sold_out"]

    def test_admin_create_and_delete_product_crud(self, authenticated_client, mongo_db):
        payload = {
            "name": "TEST_CRUD_Chair",
            "category": "Chairs",
            "price": 1234,
            "mrp": 1500,
            "description": "TEST product CRUD",
            "image_url": "",
            "featured": False,
            "colors": [],
            "sold_out": False,
        }
        created = authenticated_client.post(f"{BASE_URL}/api/products", json=payload, timeout=20)
        assert created.status_code == 201
        product = created.json()
        product_id = product["id"]
        try:
            assert isinstance(product_id, str) and product["name"] == payload["name"]
            fetched = requests.get(f"{BASE_URL}/api/products/{product_id}", timeout=20)
            assert fetched.status_code == 200 and fetched.json()["price"] == 1234
            deleted = authenticated_client.delete(f"{BASE_URL}/api/products/{product_id}", timeout=20)
            assert deleted.status_code == 200 and deleted.json() == {"ok": True}
            missing = requests.get(f"{BASE_URL}/api/products/{product_id}", timeout=20)
            assert missing.status_code == 404
        finally:
            mongo_db.products.delete_one({"id": product_id})

    def test_settings_update_persists_then_restores(self, authenticated_client):
        original_response = requests.get(f"{BASE_URL}/api/settings", timeout=20)
        assert original_response.status_code == 200
        original = original_response.json()
        original_payload = {key: original.get(key, "") for key in ["address", "hours", "map_embed_url", "logo_url"]}
        test_payload = {
            **original_payload,
            "address": "TEST_Settings_Address_42",
            "hours": "TEST_Settings_Hours_10_to_6",
        }
        try:
            updated = authenticated_client.put(f"{BASE_URL}/api/settings", json=test_payload, timeout=20)
            assert updated.status_code == 200
            assert updated.json()["address"] == test_payload["address"]
            assert updated.json()["hours"] == test_payload["hours"]
            persisted = requests.get(f"{BASE_URL}/api/settings", timeout=20)
            assert persisted.status_code == 200
            assert persisted.json()["address"] == test_payload["address"]
            assert persisted.json()["hours"] == test_payload["hours"]
        finally:
            restored = authenticated_client.put(f"{BASE_URL}/api/settings", json=original_payload, timeout=20)
            assert restored.status_code == 200
            assert restored.json()["address"] == original_payload["address"]
            assert restored.json()["hours"] == original_payload["hours"]
