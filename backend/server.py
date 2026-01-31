from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
master_db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'default-secret')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_EXPIRATION_HOURS = int(os.environ.get('JWT_EXPIRATION_HOURS', 24))

# Create the main app
app = FastAPI(title="Asset & Product Management API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    tenant_id: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    tenant_id: str
    role: str
    created_at: str

class TenantCreate(BaseModel):
    name: str
    slug: str

class TenantResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    slug: str
    db_name: str
    created_at: str
    is_active: bool

class ColorCreate(BaseModel):
    name: str
    hex_code: str
    description: Optional[str] = ""

class ColorResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    hex_code: str
    description: str
    created_at: str

class SizeCreate(BaseModel):
    name: str
    code: str
    category: Optional[str] = "general"
    sort_order: Optional[int] = 0

class SizeResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    code: str
    category: str
    sort_order: int
    created_at: str

class CustomFieldCreate(BaseModel):
    name: str
    field_type: str
    options: Optional[List[str]] = []
    required: bool = False
    default_value: Optional[str] = ""
    category: Optional[str] = "general"

class CustomFieldResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    field_type: str
    options: List[str]
    required: bool
    default_value: str
    category: str
    created_at: str

class SupplierCreate(BaseModel):
    name: str
    code: str
    email: Optional[str] = ""
    phone: Optional[str] = ""
    address: Optional[str] = ""
    country: Optional[str] = ""
    is_active: bool = True

class SupplierResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    code: str
    email: str
    phone: str
    address: str
    country: str
    is_active: bool
    created_at: str

class BuyerCreate(BaseModel):
    name: str
    code: str
    email: Optional[str] = ""
    phone: Optional[str] = ""
    address: Optional[str] = ""
    country: Optional[str] = ""
    is_active: bool = True

class BuyerResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    code: str
    email: str
    phone: str
    address: str
    country: str
    is_active: bool
    created_at: str

class BOMItem(BaseModel):
    component_id: str
    component_name: str
    quantity: float
    unit: str
    notes: Optional[str] = ""

class MeasurementItem(BaseModel):
    size_id: str
    size_name: str
    measurements: Dict[str, float]

class AssetCreate(BaseModel):
    name: str
    sku: str
    description: Optional[str] = ""
    category: Optional[str] = ""
    color_ids: Optional[List[str]] = []
    size_ids: Optional[List[str]] = []
    supplier_id: Optional[str] = ""
    custom_fields: Optional[Dict[str, Any]] = {}
    bom: Optional[List[BOMItem]] = []
    measurements: Optional[List[MeasurementItem]] = []
    status: Optional[str] = "draft"
    image_url: Optional[str] = ""

class AssetResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    sku: str
    description: str
    category: str
    color_ids: List[str]
    size_ids: List[str]
    supplier_id: str
    custom_fields: Dict[str, Any]
    bom: List[Dict]
    measurements: List[Dict]
    status: str
    image_url: str
    created_at: str
    updated_at: str

class ProductCreate(BaseModel):
    name: str
    sku: str
    description: Optional[str] = ""
    category: Optional[str] = ""
    color_ids: Optional[List[str]] = []
    size_ids: Optional[List[str]] = []
    supplier_id: Optional[str] = ""
    buyer_id: Optional[str] = ""
    custom_fields: Optional[Dict[str, Any]] = {}
    bom: Optional[List[BOMItem]] = []
    measurements: Optional[List[MeasurementItem]] = []
    status: Optional[str] = "draft"
    price: Optional[float] = 0.0
    cost: Optional[float] = 0.0
    image_url: Optional[str] = ""
    source_asset_id: Optional[str] = ""

class ProductResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    sku: str
    description: str
    category: str
    color_ids: List[str]
    size_ids: List[str]
    supplier_id: str
    buyer_id: str
    custom_fields: Dict[str, Any]
    bom: List[Dict]
    measurements: List[Dict]
    status: str
    price: float
    cost: float
    image_url: str
    source_asset_id: str
    created_at: str
    updated_at: str

class FormLayoutCreate(BaseModel):
    name: str
    entity_type: str
    layout: Dict[str, Any]
    is_default: bool = False

class FormLayoutResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    entity_type: str
    layout: Dict[str, Any]
    is_default: bool
    created_at: str

class SystemSettingsUpdate(BaseModel):
    company_name: Optional[str] = None
    logo_url: Optional[str] = None
    default_currency: Optional[str] = None
    date_format: Optional[str] = None
    timezone: Optional[str] = None

class AIGenerateRequest(BaseModel):
    context: str
    entity_type: str
    field_name: Optional[str] = ""

# ==================== HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, tenant_id: str, email: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "tenant_id": tenant_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token_data = decode_token(credentials.credentials)
    return token_data

def get_tenant_db(tenant_id: str):
    db_name = f"tenant_{tenant_id}"
    return client[db_name]

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=dict)
async def register(user: UserCreate):
    existing = await master_db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create tenant if not provided
    if not user.tenant_id:
        tenant_id = str(uuid.uuid4())
        tenant_slug = user.email.split('@')[0].lower().replace('.', '-')
        tenant_doc = {
            "id": tenant_id,
            "name": f"{user.name}'s Organization",
            "slug": tenant_slug,
            "db_name": f"tenant_{tenant_id}",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "is_active": True
        }
        await master_db.tenants.insert_one(tenant_doc)
    else:
        tenant_id = user.tenant_id
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user.email,
        "password": hash_password(user.password),
        "name": user.name,
        "tenant_id": tenant_id,
        "role": "admin" if not user.tenant_id else "user",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await master_db.users.insert_one(user_doc)
    
    # Initialize tenant database with default settings
    tenant_db = get_tenant_db(tenant_id)
    await tenant_db.settings.insert_one({
        "id": str(uuid.uuid4()),
        "company_name": user.name + "'s Company",
        "logo_url": "",
        "default_currency": "USD",
        "date_format": "YYYY-MM-DD",
        "timezone": "UTC",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    token = create_token(user_id, tenant_id, user.email, user_doc["role"])
    # Exclude _id and password from response
    user_response = {k: v for k, v in user_doc.items() if k not in ["password", "_id"]}
    return {"token": token, "user": user_response}

@api_router.post("/auth/login", response_model=dict)
async def login(credentials: UserLogin):
    user = await master_db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user["tenant_id"], user["email"], user["role"])
    return {"token": token, "user": {k: v for k, v in user.items() if k not in ["password", "_id"]}}

@api_router.get("/auth/me", response_model=dict)
async def get_me(current_user: dict = Depends(get_current_user)):
    user = await master_db.users.find_one({"id": current_user["user_id"]}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    tenant = await master_db.tenants.find_one({"id": current_user["tenant_id"]}, {"_id": 0})
    return {"user": user, "tenant": tenant}

# ==================== TENANT ROUTES ====================

@api_router.get("/tenants", response_model=List[TenantResponse])
async def get_tenants(current_user: dict = Depends(get_current_user)):
    tenants = await master_db.tenants.find({}, {"_id": 0}).to_list(100)
    return tenants

@api_router.post("/tenants", response_model=TenantResponse)
async def create_tenant(tenant: TenantCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    tenant_id = str(uuid.uuid4())
    tenant_doc = {
        "id": tenant_id,
        "name": tenant.name,
        "slug": tenant.slug,
        "db_name": f"tenant_{tenant_id}",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_active": True
    }
    await master_db.tenants.insert_one(tenant_doc)
    return tenant_doc

# ==================== COLOR LIBRARY ROUTES ====================

@api_router.get("/colors", response_model=List[ColorResponse])
async def get_colors(current_user: dict = Depends(get_current_user)):
    db = get_tenant_db(current_user["tenant_id"])
    colors = await db.colors.find({}, {"_id": 0}).to_list(1000)
    return colors

@api_router.post("/colors", response_model=ColorResponse)
async def create_color(color: ColorCreate, current_user: dict = Depends(get_current_user)):
    db = get_tenant_db(current_user["tenant_id"])
    color_doc = {
        "id": str(uuid.uuid4()),
        **color.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.colors.insert_one(color_doc)
    return color_doc

@api_router.put("/colors/{color_id}", response_model=ColorResponse)
async def update_color(color_id: str, color: ColorCreate, current_user: dict = Depends(get_current_user)):
    db = get_tenant_db(current_user["tenant_id"])
    result = await db.colors.update_one({"id": color_id}, {"$set": color.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Color not found")
    updated = await db.colors.find_one({"id": color_id}, {"_id": 0})
    return updated

@api_router.delete("/colors/{color_id}")
async def delete_color(color_id: str, current_user: dict = Depends(get_current_user)):
    db = get_tenant_db(current_user["tenant_id"])
    result = await db.colors.delete_one({"id": color_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Color not found")
    return {"status": "deleted"}

# ==================== SIZE LIBRARY ROUTES ====================

@api_router.get("/sizes", response_model=List[SizeResponse])
async def get_sizes(current_user: dict = Depends(get_current_user)):
    db = get_tenant_db(current_user["tenant_id"])
    sizes = await db.sizes.find({}, {"_id": 0}).to_list(1000)
    return sizes

@api_router.post("/sizes", response_model=SizeResponse)
async def create_size(size: SizeCreate, current_user: dict = Depends(get_current_user)):
    db = get_tenant_db(current_user["tenant_id"])
    size_doc = {
        "id": str(uuid.uuid4()),
        **size.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.sizes.insert_one(size_doc)
    return size_doc

@api_router.put("/sizes/{size_id}", response_model=SizeResponse)
async def update_size(size_id: str, size: SizeCreate, current_user: dict = Depends(get_current_user)):
    db = get_tenant_db(current_user["tenant_id"])
    result = await db.sizes.update_one({"id": size_id}, {"$set": size.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Size not found")
    updated = await db.sizes.find_one({"id": size_id}, {"_id": 0})
    return updated

@api_router.delete("/sizes/{size_id}")
async def delete_size(size_id: str, current_user: dict = Depends(get_current_user)):
    db = get_tenant_db(current_user["tenant_id"])
    result = await db.sizes.delete_one({"id": size_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Size not found")
    return {"status": "deleted"}

# ==================== CUSTOM FIELDS LIBRARY ROUTES ====================

@api_router.get("/custom-fields", response_model=List[CustomFieldResponse])
async def get_custom_fields(current_user: dict = Depends(get_current_user)):
    db = get_tenant_db(current_user["tenant_id"])
    fields = await db.custom_fields.find({}, {"_id": 0}).to_list(1000)
    return fields

@api_router.post("/custom-fields", response_model=CustomFieldResponse)
async def create_custom_field(field: CustomFieldCreate, current_user: dict = Depends(get_current_user)):
    db = get_tenant_db(current_user["tenant_id"])
    field_doc = {
        "id": str(uuid.uuid4()),
        **field.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.custom_fields.insert_one(field_doc)
    return field_doc

@api_router.put("/custom-fields/{field_id}", response_model=CustomFieldResponse)
async def update_custom_field(field_id: str, field: CustomFieldCreate, current_user: dict = Depends(get_current_user)):
    db = get_tenant_db(current_user["tenant_id"])
    result = await db.custom_fields.update_one({"id": field_id}, {"$set": field.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Custom field not found")
    updated = await db.custom_fields.find_one({"id": field_id}, {"_id": 0})
    return updated

@api_router.delete("/custom-fields/{field_id}")
async def delete_custom_field(field_id: str, current_user: dict = Depends(get_current_user)):
    db = get_tenant_db(current_user["tenant_id"])
    result = await db.custom_fields.delete_one({"id": field_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Custom field not found")
    return {"status": "deleted"}

# ==================== SUPPLIER LIBRARY ROUTES ====================

@api_router.get("/suppliers", response_model=List[SupplierResponse])
async def get_suppliers(current_user: dict = Depends(get_current_user)):
    db = get_tenant_db(current_user["tenant_id"])
    suppliers = await db.suppliers.find({}, {"_id": 0}).to_list(1000)
    return suppliers

@api_router.post("/suppliers", response_model=SupplierResponse)
async def create_supplier(supplier: SupplierCreate, current_user: dict = Depends(get_current_user)):
    db = get_tenant_db(current_user["tenant_id"])
    supplier_doc = {
        "id": str(uuid.uuid4()),
        **supplier.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.suppliers.insert_one(supplier_doc)
    return supplier_doc

@api_router.put("/suppliers/{supplier_id}", response_model=SupplierResponse)
async def update_supplier(supplier_id: str, supplier: SupplierCreate, current_user: dict = Depends(get_current_user)):
    db = get_tenant_db(current_user["tenant_id"])
    result = await db.suppliers.update_one({"id": supplier_id}, {"$set": supplier.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Supplier not found")
    updated = await db.suppliers.find_one({"id": supplier_id}, {"_id": 0})
    return updated

@api_router.delete("/suppliers/{supplier_id}")
async def delete_supplier(supplier_id: str, current_user: dict = Depends(get_current_user)):
    db = get_tenant_db(current_user["tenant_id"])
    result = await db.suppliers.delete_one({"id": supplier_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return {"status": "deleted"}

# ==================== BUYER LIBRARY ROUTES ====================

@api_router.get("/buyers", response_model=List[BuyerResponse])
async def get_buyers(current_user: dict = Depends(get_current_user)):
    db = get_tenant_db(current_user["tenant_id"])
    buyers = await db.buyers.find({}, {"_id": 0}).to_list(1000)
    return buyers

@api_router.post("/buyers", response_model=BuyerResponse)
async def create_buyer(buyer: BuyerCreate, current_user: dict = Depends(get_current_user)):
    db = get_tenant_db(current_user["tenant_id"])
    buyer_doc = {
        "id": str(uuid.uuid4()),
        **buyer.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.buyers.insert_one(buyer_doc)
    return buyer_doc

@api_router.put("/buyers/{buyer_id}", response_model=BuyerResponse)
async def update_buyer(buyer_id: str, buyer: BuyerCreate, current_user: dict = Depends(get_current_user)):
    db = get_tenant_db(current_user["tenant_id"])
    result = await db.buyers.update_one({"id": buyer_id}, {"$set": buyer.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Buyer not found")
    updated = await db.buyers.find_one({"id": buyer_id}, {"_id": 0})
    return updated

@api_router.delete("/buyers/{buyer_id}")
async def delete_buyer(buyer_id: str, current_user: dict = Depends(get_current_user)):
    db = get_tenant_db(current_user["tenant_id"])
    result = await db.buyers.delete_one({"id": buyer_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Buyer not found")
    return {"status": "deleted"}

# ==================== ASSET ROUTES ====================

@api_router.get("/assets", response_model=List[AssetResponse])
async def get_assets(current_user: dict = Depends(get_current_user)):
    db = get_tenant_db(current_user["tenant_id"])
    assets = await db.assets.find({}, {"_id": 0}).to_list(1000)
    return assets

@api_router.get("/assets/{asset_id}", response_model=AssetResponse)
async def get_asset(asset_id: str, current_user: dict = Depends(get_current_user)):
    db = get_tenant_db(current_user["tenant_id"])
    asset = await db.assets.find_one({"id": asset_id}, {"_id": 0})
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset

@api_router.post("/assets", response_model=AssetResponse)
async def create_asset(asset: AssetCreate, current_user: dict = Depends(get_current_user)):
    db = get_tenant_db(current_user["tenant_id"])
    now = datetime.now(timezone.utc).isoformat()
    asset_doc = {
        "id": str(uuid.uuid4()),
        **asset.model_dump(),
        "bom": [item.model_dump() if hasattr(item, 'model_dump') else item for item in asset.bom or []],
        "measurements": [item.model_dump() if hasattr(item, 'model_dump') else item for item in asset.measurements or []],
        "created_at": now,
        "updated_at": now
    }
    await db.assets.insert_one(asset_doc)
    return asset_doc

@api_router.put("/assets/{asset_id}", response_model=AssetResponse)
async def update_asset(asset_id: str, asset: AssetCreate, current_user: dict = Depends(get_current_user)):
    db = get_tenant_db(current_user["tenant_id"])
    update_data = asset.model_dump()
    update_data["bom"] = [item.model_dump() if hasattr(item, 'model_dump') else item for item in asset.bom or []]
    update_data["measurements"] = [item.model_dump() if hasattr(item, 'model_dump') else item for item in asset.measurements or []]
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.assets.update_one({"id": asset_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Asset not found")
    updated = await db.assets.find_one({"id": asset_id}, {"_id": 0})
    return updated

@api_router.delete("/assets/{asset_id}")
async def delete_asset(asset_id: str, current_user: dict = Depends(get_current_user)):
    db = get_tenant_db(current_user["tenant_id"])
    result = await db.assets.delete_one({"id": asset_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Asset not found")
    return {"status": "deleted"}

# ==================== PRODUCT ROUTES ====================

@api_router.get("/products", response_model=List[ProductResponse])
async def get_products(current_user: dict = Depends(get_current_user)):
    db = get_tenant_db(current_user["tenant_id"])
    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    return products

@api_router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str, current_user: dict = Depends(get_current_user)):
    db = get_tenant_db(current_user["tenant_id"])
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@api_router.post("/products", response_model=ProductResponse)
async def create_product(product: ProductCreate, current_user: dict = Depends(get_current_user)):
    db = get_tenant_db(current_user["tenant_id"])
    now = datetime.now(timezone.utc).isoformat()
    product_doc = {
        "id": str(uuid.uuid4()),
        **product.model_dump(),
        "bom": [item.model_dump() if hasattr(item, 'model_dump') else item for item in product.bom or []],
        "measurements": [item.model_dump() if hasattr(item, 'model_dump') else item for item in product.measurements or []],
        "created_at": now,
        "updated_at": now
    }
    await db.products.insert_one(product_doc)
    return product_doc

@api_router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(product_id: str, product: ProductCreate, current_user: dict = Depends(get_current_user)):
    db = get_tenant_db(current_user["tenant_id"])
    update_data = product.model_dump()
    update_data["bom"] = [item.model_dump() if hasattr(item, 'model_dump') else item for item in product.bom or []]
    update_data["measurements"] = [item.model_dump() if hasattr(item, 'model_dump') else item for item in product.measurements or []]
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.products.update_one({"id": product_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    updated = await db.products.find_one({"id": product_id}, {"_id": 0})
    return updated

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, current_user: dict = Depends(get_current_user)):
    db = get_tenant_db(current_user["tenant_id"])
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"status": "deleted"}

# ==================== CONVERT ASSET TO PRODUCT ====================

@api_router.post("/assets/{asset_id}/convert-to-product", response_model=ProductResponse)
async def convert_asset_to_product(asset_id: str, current_user: dict = Depends(get_current_user)):
    db = get_tenant_db(current_user["tenant_id"])
    asset = await db.assets.find_one({"id": asset_id}, {"_id": 0})
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    now = datetime.now(timezone.utc).isoformat()
    product_doc = {
        "id": str(uuid.uuid4()),
        "name": asset["name"],
        "sku": f"PRD-{asset['sku']}",
        "description": asset.get("description", ""),
        "category": asset.get("category", ""),
        "color_ids": asset.get("color_ids", []),
        "size_ids": asset.get("size_ids", []),
        "supplier_id": asset.get("supplier_id", ""),
        "buyer_id": "",
        "custom_fields": asset.get("custom_fields", {}),
        "bom": asset.get("bom", []),
        "measurements": asset.get("measurements", []),
        "status": "draft",
        "price": 0.0,
        "cost": 0.0,
        "image_url": asset.get("image_url", ""),
        "source_asset_id": asset_id,
        "created_at": now,
        "updated_at": now
    }
    await db.products.insert_one(product_doc)
    return product_doc

# ==================== FORM LAYOUT ROUTES ====================

@api_router.get("/form-layouts", response_model=List[FormLayoutResponse])
async def get_form_layouts(current_user: dict = Depends(get_current_user)):
    db = get_tenant_db(current_user["tenant_id"])
    layouts = await db.form_layouts.find({}, {"_id": 0}).to_list(100)
    return layouts

@api_router.get("/form-layouts/{entity_type}", response_model=List[FormLayoutResponse])
async def get_form_layouts_by_type(entity_type: str, current_user: dict = Depends(get_current_user)):
    db = get_tenant_db(current_user["tenant_id"])
    layouts = await db.form_layouts.find({"entity_type": entity_type}, {"_id": 0}).to_list(100)
    return layouts

@api_router.post("/form-layouts", response_model=FormLayoutResponse)
async def create_form_layout(layout: FormLayoutCreate, current_user: dict = Depends(get_current_user)):
    db = get_tenant_db(current_user["tenant_id"])
    layout_doc = {
        "id": str(uuid.uuid4()),
        **layout.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.form_layouts.insert_one(layout_doc)
    return layout_doc

@api_router.put("/form-layouts/{layout_id}", response_model=FormLayoutResponse)
async def update_form_layout(layout_id: str, layout: FormLayoutCreate, current_user: dict = Depends(get_current_user)):
    db = get_tenant_db(current_user["tenant_id"])
    result = await db.form_layouts.update_one({"id": layout_id}, {"$set": layout.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Form layout not found")
    updated = await db.form_layouts.find_one({"id": layout_id}, {"_id": 0})
    return updated

@api_router.delete("/form-layouts/{layout_id}")
async def delete_form_layout(layout_id: str, current_user: dict = Depends(get_current_user)):
    db = get_tenant_db(current_user["tenant_id"])
    result = await db.form_layouts.delete_one({"id": layout_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Form layout not found")
    return {"status": "deleted"}

# ==================== SYSTEM SETTINGS ROUTES ====================

@api_router.get("/settings")
async def get_settings(current_user: dict = Depends(get_current_user)):
    db = get_tenant_db(current_user["tenant_id"])
    settings = await db.settings.find_one({}, {"_id": 0})
    if not settings:
        return {
            "company_name": "",
            "logo_url": "",
            "default_currency": "USD",
            "date_format": "YYYY-MM-DD",
            "timezone": "UTC"
        }
    return settings

@api_router.put("/settings")
async def update_settings(settings: SystemSettingsUpdate, current_user: dict = Depends(get_current_user)):
    db = get_tenant_db(current_user["tenant_id"])
    update_data = {k: v for k, v in settings.model_dump().items() if v is not None}
    await db.settings.update_one({}, {"$set": update_data}, upsert=True)
    updated = await db.settings.find_one({}, {"_id": 0})
    return updated

# ==================== AI DATA GENERATION ROUTES ====================

@api_router.post("/ai/generate")
async def generate_ai_data(request: AIGenerateRequest, current_user: dict = Depends(get_current_user)):
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        system_prompt = f"""You are an AI assistant helping with product and asset management in a design/development context.
        Generate helpful, realistic data for {request.entity_type} attributes.
        Be concise and professional. Return only the requested data without explanations."""
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"gen_{uuid.uuid4()}",
            system_message=system_prompt
        ).with_model("openai", "gpt-5.2")
        
        prompt = f"Context: {request.context}"
        if request.field_name:
            prompt += f"\nGenerate a value for the field: {request.field_name}"
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        return {"generated": response, "field_name": request.field_name}
    except ImportError:
        raise HTTPException(status_code=500, detail="AI service not available")
    except Exception as e:
        logger.error(f"AI generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

# ==================== DASHBOARD STATS ====================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    db = get_tenant_db(current_user["tenant_id"])
    
    assets_count = await db.assets.count_documents({})
    products_count = await db.products.count_documents({})
    suppliers_count = await db.suppliers.count_documents({})
    buyers_count = await db.buyers.count_documents({})
    colors_count = await db.colors.count_documents({})
    sizes_count = await db.sizes.count_documents({})
    
    # Get recent assets
    recent_assets = await db.assets.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    recent_products = await db.products.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    
    # Assets by status
    assets_by_status = {}
    async for doc in db.assets.aggregate([{"$group": {"_id": "$status", "count": {"$sum": 1}}}]):
        assets_by_status[doc["_id"] or "unknown"] = doc["count"]
    
    products_by_status = {}
    async for doc in db.products.aggregate([{"$group": {"_id": "$status", "count": {"$sum": 1}}}]):
        products_by_status[doc["_id"] or "unknown"] = doc["count"]
    
    return {
        "counts": {
            "assets": assets_count,
            "products": products_count,
            "suppliers": suppliers_count,
            "buyers": buyers_count,
            "colors": colors_count,
            "sizes": sizes_count
        },
        "recent_assets": recent_assets,
        "recent_products": recent_products,
        "assets_by_status": assets_by_status,
        "products_by_status": products_by_status
    }

# ==================== USER MANAGEMENT ====================

@api_router.get("/users", response_model=List[UserResponse])
async def get_users(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    users = await master_db.users.find({"tenant_id": current_user["tenant_id"]}, {"_id": 0, "password": 0}).to_list(100)
    return users

@api_router.post("/users", response_model=UserResponse)
async def create_user(user: UserCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    existing = await master_db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user.email,
        "password": hash_password(user.password),
        "name": user.name,
        "tenant_id": current_user["tenant_id"],
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await master_db.users.insert_one(user_doc)
    return {k: v for k, v in user_doc.items() if k != "password"}

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    if user_id == current_user["user_id"]:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    result = await master_db.users.delete_one({"id": user_id, "tenant_id": current_user["tenant_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "deleted"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
