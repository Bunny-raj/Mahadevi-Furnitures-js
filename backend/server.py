from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / '.env')

import os
import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional
from urllib.parse import quote

import bcrypt
import jwt
import requests
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_ALGORITHM = "HS256"
WHATSAPP_NUMBER = os.environ.get("WHATSAPP_NUMBER", "919949700111")

STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "mahadevi-furnitures"
storage_key = None


def init_storage(force: bool = False):
    global storage_key
    if storage_key and not force:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": init_storage(), "Content-Type": content_type},
        data=data, timeout=120)
    resp.raise_for_status()
    return resp.json()


def get_object(path: str):
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": init_storage()}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

app = FastAPI()
api_router = APIRouter(prefix="/api")


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "type": "access",
               "exp": datetime.now(timezone.utc) + timedelta(minutes=60)}
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "type": "refresh",
               "exp": datetime.now(timezone.utc) + timedelta(days=7)}
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=JWT_ALGORITHM)


def set_auth_cookies(response: Response, user_id: str, email: str):
    response.set_cookie("access_token", create_access_token(user_id, email),
                        httponly=True, secure=True, samesite="none", max_age=3600, path="/")
    response.set_cookie("refresh_token", create_refresh_token(user_id),
                        httponly=True, secure=True, samesite="none", max_age=604800, path="/")


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


class LoginIn(BaseModel):
    email: str
    password: str


class ProductIn(BaseModel):
    name: str
    category: str
    price: float
    mrp: float = 0
    description: str = ""
    image_url: str = ""
    featured: bool = False
    colors: list[str] = []
    sold_out: bool = False


class OrderIn(BaseModel):
    product_id: str = ""
    product_name: str
    quantity: int = 1
    name: str
    phone: str
    address: str = ""
    color: str = ""


class OrderStatusIn(BaseModel):
    status: str


class ReviewIn(BaseModel):
    name: str
    rating: int = 5
    text: str
    photo_url: str = ""


class ReviewApproveIn(BaseModel):
    approved: bool = True


class ReviewReplyIn(BaseModel):
    reply: str = ""


VALID_ORDER_STATUSES = {"pending", "confirmed", "delivered", "cancelled"}


@api_router.get("/")
async def root():
    return {"message": "MAHADEVI FURNITURES API"}


@api_router.post("/auth/login")
async def login(body: LoginIn, request: Request, response: Response):
    email = body.email.lower().strip()
    identifier = email
    attempts = await db.login_attempts.find_one({"identifier": identifier})
    if attempts and attempts.get("count", 0) >= 5:
        locked_until = attempts.get("locked_until", "")
        if locked_until and datetime.fromisoformat(locked_until) > datetime.now(timezone.utc):
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1},
             "$set": {"locked_until": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()}},
            upsert=True)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await db.login_attempts.delete_many({"identifier": identifier})
    set_auth_cookies(response, user["id"], email)
    return {"id": user["id"], "email": email, "name": user.get("name", "Admin"), "role": user.get("role", "admin")}


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


@api_router.post("/auth/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    response.set_cookie("access_token", create_access_token(user["id"], user["email"]),
                        httponly=True, secure=True, samesite="none", max_age=3600, path="/")
    return {"ok": True}


@api_router.get("/products")
async def list_products(category: Optional[str] = None, q: Optional[str] = None,
                        featured: Optional[bool] = None):
    query = {}
    if category and category != "All":
        query["category"] = category
    if featured:
        query["featured"] = True
    if q:
        query["name"] = {"$regex": q, "$options": "i"}
    return await db.products.find(query, {"_id": 0}).sort("created_at", 1).to_list(500)


@api_router.get("/products/categories")
async def list_categories():
    return await db.products.distinct("category")


@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@api_router.post("/products", status_code=201)
async def create_product(body: ProductIn, user: dict = Depends(get_current_user)):
    doc = body.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.products.insert_one({**doc})
    return doc


@api_router.put("/products/{product_id}")
async def update_product(product_id: str, body: ProductIn, user: dict = Depends(get_current_user)):
    result = await db.products.update_one({"id": product_id}, {"$set": body.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return await db.products.find_one({"id": product_id}, {"_id": 0})


@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, user: dict = Depends(get_current_user)):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"ok": True}


@api_router.post("/orders", status_code=201)
async def create_order(body: OrderIn):
    doc = body.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["status"] = "pending"
    await db.orders.insert_one({**doc})
    color_line = f"Colour: {body.color}\n" if body.color else ""
    message = (
        f"Hello MAHADEVI FURNITURES! I would like to place an order.\n\n"
        f"Product: {body.product_name}\n"
        f"{color_line}"
        f"Quantity: {body.quantity}\n"
        f"Name: {body.name}\n"
        f"Phone: {body.phone}\n"
        f"Address: {body.address or '-'}"
    )
    wa_link = f"https://wa.me/{WHATSAPP_NUMBER}?text={quote(message)}"
    return {"ok": True, "order_id": doc["id"], "wa_link": wa_link}


@api_router.get("/orders")
async def list_orders(user: dict = Depends(get_current_user)):
    return await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, body: OrderStatusIn, user: dict = Depends(get_current_user)):
    if body.status not in VALID_ORDER_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")
    result = await db.orders.update_one({"id": order_id}, {"$set": {"status": body.status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"ok": True, "status": body.status}


@api_router.post("/reviews", status_code=201)
async def create_review(body: ReviewIn):
    if not body.name.strip() or not body.text.strip():
        raise HTTPException(status_code=400, detail="Name and review text are required")
    doc = body.model_dump()
    doc["rating"] = max(1, min(5, doc["rating"]))
    doc["id"] = str(uuid.uuid4())
    doc["approved"] = False
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.reviews.insert_one({**doc})
    return {"ok": True, "id": doc["id"]}


@api_router.get("/reviews")
async def list_approved_reviews():
    return await db.reviews.find({"approved": True}, {"_id": 0}).sort("created_at", -1).to_list(100)


@api_router.get("/reviews/all")
async def list_all_reviews(user: dict = Depends(get_current_user)):
    return await db.reviews.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


@api_router.put("/reviews/{review_id}/approve")
async def approve_review(review_id: str, body: ReviewApproveIn, user: dict = Depends(get_current_user)):
    result = await db.reviews.update_one({"id": review_id}, {"$set": {"approved": body.approved}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    return {"ok": True}


@api_router.delete("/reviews/{review_id}")
async def delete_review(review_id: str, user: dict = Depends(get_current_user)):
    result = await db.reviews.delete_one({"id": review_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    return {"ok": True}


@api_router.put("/reviews/{review_id}/reply")
async def reply_to_review(review_id: str, body: ReviewReplyIn, user: dict = Depends(get_current_user)):
    result = await db.reviews.update_one({"id": review_id}, {"$set": {"owner_reply": body.reply.strip()}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    return {"ok": True}


@api_router.post("/reviews/upload", status_code=201)
async def upload_review_photo(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Only image files (jpg, png, webp, gif) are allowed")
    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 5 MB)")
    if not is_valid_image(data):
        raise HTTPException(status_code=400, detail="Invalid image file")
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "jpg"
    path = f"{APP_NAME}/reviews/{uuid.uuid4()}.{ext}"
    result = put_object(path, data, file.content_type)
    await db.files.insert_one({
        "id": str(uuid.uuid4()), "storage_path": result["path"],
        "original_filename": file.filename, "content_type": file.content_type,
        "size": result["size"], "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()})
    return {"path": result["path"], "url": f"/api/files/{result['path']}"}


class SettingsIn(BaseModel):
    address: str = ""
    hours: str = ""
    map_embed_url: str = ""
    logo_url: str = ""


ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}

IMAGE_SIGNATURES = [b"\xff\xd8\xff", b"\x89PNG\r\n\x1a\n", b"GIF87a", b"GIF89a", b"RIFF"]


def is_valid_image(data: bytes) -> bool:
    return any(data.startswith(sig) for sig in IMAGE_SIGNATURES)


@api_router.post("/upload", status_code=201)
async def upload_image(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Only image files (jpg, png, webp, gif) are allowed")
    data = await file.read()
    if len(data) > 8 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 8 MB)")
    if not is_valid_image(data):
        raise HTTPException(status_code=400, detail="Invalid image file")
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "jpg"
    path = f"{APP_NAME}/uploads/{user['id']}/{uuid.uuid4()}.{ext}"
    result = put_object(path, data, file.content_type)
    await db.files.insert_one({
        "id": str(uuid.uuid4()), "storage_path": result["path"],
        "original_filename": file.filename, "content_type": file.content_type,
        "size": result["size"], "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()})
    return {"path": result["path"], "url": f"/api/files/{result['path']}"}


@api_router.get("/files/{path:path}")
async def serve_file(path: str):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    data, content_type = get_object(path)
    return Response(content=data, media_type=record.get("content_type") or content_type)


@api_router.get("/settings")
async def get_settings():
    doc = await db.settings.find_one({"key": "shop"}, {"_id": 0})
    return doc or {"key": "shop", "address": "", "hours": "", "map_embed_url": "", "logo_url": ""}


@api_router.put("/settings")
async def update_settings(body: SettingsIn, user: dict = Depends(get_current_user)):
    doc = {"key": "shop", **body.model_dump()}
    await db.settings.update_one({"key": "shop"}, {"$set": doc}, upsert=True)
    return doc


SEED_PRODUCTS = [
    {"name": "Imperial Teak 3-Seater Sofa", "category": "Sofas", "price": 24999, "featured": True,
     "description": "Solid teak frame with plush high-density cushions. A statement piece for your living room, built to last generations.",
     "image_url": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80"},
    {"name": "Chesterfield 2-Seater Sofa", "category": "Sofas", "price": 19499, "featured": True,
     "description": "Classic chesterfield silhouette in premium upholstery. Deep seating comfort with a timeless profile.",
     "image_url": "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=800&q=80"},
    {"name": "Cloud Comfort Recliner", "category": "Recliners", "price": 18499, "featured": True,
     "description": "Smooth reclining mechanism with padded armrests. Your favourite corner of the house, guaranteed.",
     "image_url": "https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=800&q=80"},
    {"name": "Royal Solid Wood King Bed", "category": "Beds", "price": 32999, "featured": True,
     "description": "Seasoned hardwood king-size bed with a hand-finished headboard. Sleeps like royalty, priced fairly.",
     "image_url": "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80"},
    {"name": "Urban Queen Bed with Storage", "category": "Beds", "price": 27499, "featured": False,
     "description": "Queen-size bed with hydraulic under-bed storage. Clean lines, warm walnut finish.",
     "image_url": "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=80"},
    {"name": "Heritage 6-Seater Dining Set", "category": "Dining Tables", "price": 28499, "featured": True,
     "description": "Six-seater dining set in solid wood with cushioned chairs. Where family dinners become traditions.",
     "image_url": "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80"},
    {"name": "Walnut 4-Seater Dining Table", "category": "Dining Tables", "price": 16999, "featured": False,
     "description": "Compact four-seater with a rich walnut top. Perfect for modern apartments.",
     "image_url": "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80"},
    {"name": "Grand 3-Door Wardrobe", "category": "Wardrobes", "price": 21999, "featured": False,
     "description": "Three-door wardrobe with mirror, hanging space and lockable drawer. Ample storage, elegant facade.",
     "image_url": "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80"},
    {"name": "Elegance Dressing Table", "category": "Dressing Tables", "price": 9999, "featured": False,
     "description": "Dressing table with full-length mirror and smooth-glide drawers. A quiet luxury for your bedroom.",
     "image_url": "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=800&q=80"},
    {"name": "Premium Plastic Chairs (Set of 4)", "category": "Chairs", "price": 1999, "featured": False,
     "description": "Heavy-duty, weather-resistant chairs in a set of four. Light to move, strong to sit.",
     "image_url": "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=800&q=80"},
    {"name": "ErgoWork Office Table", "category": "Office Tables", "price": 7499, "featured": False,
     "description": "Spacious office table with cable management and a scratch-resistant top. Built for long workdays.",
     "image_url": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80"},
    {"name": "Compact Laptop & Computer Table", "category": "Computer Tables", "price": 2499, "featured": False,
     "description": "Space-saving computer table with keyboard tray and shelf. Ideal for study and work-from-home setups.",
     "image_url": "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80"},
]


CATEGORY_COLORS = {
    "Sofas": ["Walnut Brown", "Grey", "Beige"],
    "Recliners": ["Black", "Brown", "Grey"],
    "Beds": ["Walnut Brown", "Teak", "Honey"],
    "Dining Tables": ["Walnut Brown", "Teak"],
    "Wardrobes": ["Walnut Brown", "White", "Grey"],
    "Dressing Tables": ["Walnut Brown", "White"],
    "Chairs": ["White", "Red", "Blue", "Green"],
    "Office Tables": ["Walnut Brown", "Black"],
    "Computer Tables": ["Walnut Brown", "Black"],
}


@app.on_event("startup")
async def startup():
    try:
        init_storage()
        logging.getLogger(__name__).info("Object storage initialized")
    except Exception as e:
        logging.getLogger(__name__).error("Storage init failed: %s", e)
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.products.create_index("category")

    admin_email = os.environ.get("ADMIN_EMAIL")
    admin_password = os.environ.get("ADMIN_PASSWORD")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()), "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Shop Owner", "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()})
        logging.getLogger(__name__).info("Admin seeded: %s", admin_email)
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email},
                                  {"$set": {"password_hash": hash_password(admin_password)}})

    if await db.products.count_documents({}) == 0:
        now = datetime.now(timezone.utc).isoformat()
        mrp_factors = [2.5, 1.67, 1.67, 2.5, 1.56, 1.67, 1.25, 1.43, 1.67, 2.0, 1.67, 2.0]
        await db.products.insert_many(
            [{**p, "mrp": int(round(p["price"] * mrp_factors[i % len(mrp_factors)] / 100) * 100 - 1),
              "colors": CATEGORY_COLORS.get(p["category"], []), "sold_out": False,
              "id": str(uuid.uuid4()), "created_at": now} for i, p in enumerate(SEED_PRODUCTS)])
        logging.getLogger(__name__).info("Seeded %d products", len(SEED_PRODUCTS))

    if await db.reviews.count_documents({}) == 0:
        now = datetime.now(timezone.utc).isoformat()
        sample_reviews = [
            {"name": "Ramesh Kumar", "rating": 5, "photo_url": "",
             "text": "Ordered a teak sofa on WhatsApp and it was delivered in 4 days. Solid wood, exactly like the photos. Very happy with the price too."},
            {"name": "Lakshmi Devi", "rating": 5, "photo_url": "",
             "text": "Bought the king size bed for my daughter's wedding. Beautiful finishing and the owner was very helpful on WhatsApp. Highly recommend Mahadevi Furnitures."},
            {"name": "Suresh Reddy", "rating": 4, "photo_url": "",
             "text": "Good quality dining set at a fair price. Delivery team assembled everything at home. Will buy again."},
        ]
        await db.reviews.insert_many(
            [{**r, "id": str(uuid.uuid4()), "approved": True, "created_at": now} for r in sample_reviews])
        logging.getLogger(__name__).info("Seeded sample reviews")


app.include_router(api_router)

origins = [o for o in [os.environ.get("FRONTEND_URL"), "http://localhost:3000"] if o]
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
