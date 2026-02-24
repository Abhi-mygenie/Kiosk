from fastapi import FastAPI, APIRouter, HTTPException, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import httpx


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging early
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# POS API Configuration
POS_API_BASE_URL = "https://preprod.mygenie.online/api/v1"
POS_API_V2_URL = "https://preprod.mygenie.online/api/v2"

# Cache for menu data (token comes from user now)
menu_cache = {"data": None, "expires": None, "token": None}

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Helper function to extract token from Authorization header
def get_token_from_header(authorization: Optional[str] = None) -> Optional[str]:
    if authorization and authorization.startswith("Bearer "):
        return authorization[7:]
    return None


# Define Models
class Variation(BaseModel):
    id: str
    name: str
    price: float = 0.0

class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    image: str

class MenuItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    description: str
    price: float
    image: str
    category: str
    available: bool = True
    variations: List[Variation] = []
    calories: int = 0
    portion_size: str = "Regular"
    allergens: List[str] = []

class CartItem(BaseModel):
    item_id: str
    name: str
    price: float
    quantity: int
    variations: List[str] = []
    special_instructions: Optional[str] = None

class OrderCreate(BaseModel):
    table_number: str
    table_id: Optional[str] = None
    items: List[CartItem]
    subtotal: Optional[float] = None
    discount: Optional[float] = 0
    coupon_code: Optional[str] = None
    cgst: Optional[float] = 0
    sgst: Optional[float] = 0
    total: float
    customer_name: Optional[str] = None
    customer_mobile: Optional[str] = None

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    table_number: str
    table_id: Optional[str] = None
    items: List[CartItem]
    subtotal: Optional[float] = None
    discount: float = 0
    coupon_code: Optional[str] = None
    cgst: float = 0
    sgst: float = 0
    total: float
    customer_name: Optional[str] = None
    customer_mobile: Optional[str] = None
    status: str = "pending"
    pos_order_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BrandingConfig(BaseModel):
    # Basic Info
    restaurant_name: str = "Hotel Lumiere"
    logo_url: Optional[str] = None
    
    # Colors (matching current UI)
    primary_color: str = "#177DAA"
    secondary_color: str = "#62B5E5"
    accent_color: str = "#62B5E5"
    text_color: str = "#06293F"
    background_color: str = "#F9F8F6"
    
    # Fonts (matching current UI)
    heading_font: str = "Big Shoulders Display"
    body_font: str = "Montserrat"
    font_url: str = "https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@400;500;600;700;800&family=Montserrat:wght@300;400;500;600;700&display=swap"
    
    # UI Style (matching current UI)
    button_style: str = "rounded"
    icon_style: str = "outline"
    border_radius: str = "8px"
    
    # App Assets
    splash_screen_image: Optional[str] = None
    app_icon: Optional[str] = None
    favicon: Optional[str] = None
    
    # Loader (matching current UI)
    loader_type: str = "spinner"
    loader_color: str = "#177DAA"


@api_router.get("/")
async def root():
    return {"message": "Kiosk API Ready"}


# POS Menu Integration Helper Functions
async def fetch_pos_menu(token: str, force_refresh: bool = False):
    """Fetch menu from POS API using the provided token"""
    now = datetime.now(timezone.utc)
    
    # Check cache (cache for 5 minutes) - also check if same token
    if not force_refresh and menu_cache["data"] and menu_cache["expires"] and menu_cache["expires"] > now and menu_cache["token"] == token:
        return menu_cache["data"]
    
    if not token:
        logger.warning("No POS token provided")
        return None
    
    try:
        async with httpx.AsyncClient() as client_http:
            response = await client_http.get(
                f"{POS_API_V2_URL}/vendoremployee/product/foods-list?food_for=Normal",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                },
                timeout=30.0
            )
            if response.status_code == 200:
                data = response.json()
                foods = data.get("foods", [])
                
                # Cache for 5 minutes
                from datetime import timedelta
                menu_cache["data"] = foods
                menu_cache["expires"] = now + timedelta(minutes=5)
                menu_cache["token"] = token
                
                logger.info(f"Fetched {len(foods)} items from POS menu")
                return foods
            elif response.status_code == 401:
                logger.warning("POS token expired or invalid")
                return None
    except Exception as e:
        logger.error(f"Failed to fetch POS menu: {e}")
    return None


def transform_pos_food_to_menu_item(food: dict) -> dict:
    """Transform POS food item to our MenuItem format"""
    category = food.get("category", {})
    
    # Transform variations from POS format
    variation_groups = []
    for variation_group in food.get("variation", []):
        if isinstance(variation_group, dict):
            group_name = variation_group.get("name", "Choice")
            group_type = variation_group.get("type", "single")
            required = variation_group.get("required", "off") == "on"
            min_select = variation_group.get("min", 0)
            max_select = variation_group.get("max", 0)
            
            try:
                min_select = int(min_select) if min_select else 0
            except (ValueError, TypeError):
                min_select = 0
            try:
                max_select = int(max_select) if max_select else 0
            except (ValueError, TypeError):
                max_select = 0
            
            values = variation_group.get("values", [])
            group_options = []
            for val in values:
                if isinstance(val, dict):
                    label = val.get("label", "")
                    price_str = val.get("optionPrice", "0")
                    try:
                        price = float(price_str) if price_str else 0
                    except (ValueError, TypeError):
                        price = 0
                    group_options.append({
                        "id": f"{group_name}_{label}".replace(" ", "_").lower(),
                        "name": label.upper(),
                        "price": price
                    })
            if group_options:
                variation_groups.append({
                    "group_name": group_name.upper(),
                    "type": "single" if group_type == "single" else "multiple",
                    "required": required,
                    "min_select": min_select,
                    "max_select": max_select,
                    "options": group_options
                })
    
    # Transform addons as a separate group
    addon_options = []
    for addon in food.get("addons", []):
        if isinstance(addon, dict):
            addon_name = addon.get("name", "")
            addon_price_str = addon.get("price", "0")
            try:
                addon_price = float(addon_price_str) if addon_price_str else 0
            except (ValueError, TypeError):
                addon_price = 0
            addon_options.append({
                "id": f"addon_{addon.get('id', '')}",
                "name": addon_name.upper(),
                "price": addon_price
            })
    
    if addon_options:
        variation_groups.append({
            "group_name": "ADD-ONS",
            "type": "multiple",
            "required": False,
            "min_select": 0,
            "max_select": 0,
            "options": addon_options
        })
    
    # Flatten for backward compatibility
    variations = []
    for group in variation_groups:
        variations.extend(group["options"])
    
    # Safely parse calories
    kcal_value = food.get("kcal", 0)
    try:
        calories = int(float(kcal_value)) if kcal_value else 0
    except (ValueError, TypeError):
        calories = 0
    
    # Parse price fields
    base_price = float(food.get("price", 0) or 0)
    
    # Parse discount
    discount_value = food.get("discount", 0)
    try:
        discount = float(discount_value) if discount_value else 0
    except (ValueError, TypeError):
        discount = 0
    
    # Parse tax
    tax_value = food.get("tax", 0)
    try:
        tax_percent = float(tax_value) if tax_value else 0
    except (ValueError, TypeError):
        tax_percent = 0
    
    # Check if item is complementary
    is_complementary = str(food.get("complementary", "no")).lower() in ["yes", "true", "1"]
    
    # Calculate final price
    if is_complementary:
        final_price = 0
        discount = 0
        tax_amount = 0
    else:
        price_after_discount = base_price - discount
        tax_amount = (price_after_discount * tax_percent) / 100
        final_price = price_after_discount + tax_amount
    
    return {
        "id": str(food.get("id", "")),
        "name": food.get("name", ""),
        "description": food.get("description", "") or "",
        "price": round(final_price, 2),
        "base_price": round(base_price, 2),
        "is_complementary": is_complementary,
        "discount": round(discount, 2),
        "tax_percent": round(tax_percent, 2),
        "tax_amount": round(tax_amount, 2) if not is_complementary else 0,
        "image": food.get("image", ""),
        "category": str(category.get("id", "")),
        "category_name": category.get("name", ""),
        "available": food.get("status", 1) == 1,
        "variations": variations,
        "variation_groups": variation_groups,
        "calories": calories,
        "portion_size": food.get("portion_size", "") or "",
        "allergens": food.get("allergens", []) or []
    }


@api_router.get("/menu/categories")
async def get_categories(authorization: Optional[str] = Header(None)):
    """Get categories from POS API - requires authentication"""
    token = get_token_from_header(authorization)
    
    if not token:
        raise HTTPException(status_code=401, detail="Authorization token required")
    
    pos_foods = await fetch_pos_menu(token)
    
    if not pos_foods:
        raise HTTPException(status_code=503, detail="Unable to fetch menu from POS")
    
    # Extract unique categories from POS data
    categories_dict = {}
    for food in pos_foods:
        cat = food.get("category", {})
        cat_id = str(cat.get("id", ""))
        cat_name = cat.get("name", "")
        if cat_id and cat_name and cat_id not in categories_dict:
            categories_dict[cat_id] = {
                "id": cat_id,
                "name": cat_name,
                "image": food.get("image", "")
            }
    
    # Return sorted by name
    return sorted(categories_dict.values(), key=lambda x: x["name"])


@api_router.get("/menu/items")
async def get_menu_items(category: Optional[str] = None, authorization: Optional[str] = Header(None)):
    """Get menu items from POS API - requires authentication"""
    token = get_token_from_header(authorization)
    
    if not token:
        raise HTTPException(status_code=401, detail="Authorization token required")
    
    pos_foods = await fetch_pos_menu(token)
    
    if not pos_foods:
        raise HTTPException(status_code=503, detail="Unable to fetch menu from POS")
    
    # Transform POS foods to our format
    items = [transform_pos_food_to_menu_item(food) for food in pos_foods if food.get("status", 1) == 1]
    
    if category:
        items = [item for item in items if item["category"] == category]
    
    return items


# Tables cache
tables_cache = {"data": None, "expires": None, "token": None}

async def fetch_pos_tables(token: str):
    """Fetch tables from POS API using the provided token"""
    now = datetime.now(timezone.utc)
    
    # Check cache (cache for 5 minutes)
    if tables_cache["data"] and tables_cache["expires"] and tables_cache["expires"] > now and tables_cache["token"] == token:
        return tables_cache["data"]
    
    if not token:
        logger.warning("No POS token available for tables")
        return None
    
    try:
        async with httpx.AsyncClient() as client_http:
            response = await client_http.get(
                f"{POS_API_V2_URL}/vendoremployee/restaurant-settings/table-config",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                },
                timeout=30.0
            )
            if response.status_code == 200:
                data = response.json()
                tables = data.get("data", {}).get("tables", [])
                
                # Cache for 5 minutes
                from datetime import timedelta
                tables_cache["data"] = tables
                tables_cache["expires"] = now + timedelta(minutes=5)
                tables_cache["token"] = token
                
                logger.info(f"Fetched {len(tables)} tables from POS")
                return tables
            elif response.status_code == 401:
                logger.warning("POS token expired or invalid for tables")
                return None
    except Exception as e:
        logger.error(f"Failed to fetch POS tables: {e}")
    return None


@api_router.get("/tables")
async def get_tables(authorization: Optional[str] = Header(None)):
    """Get tables from POS API - requires authentication"""
    token = get_token_from_header(authorization)
    
    if not token:
        raise HTTPException(status_code=401, detail="Authorization token required")
    
    pos_tables = await fetch_pos_tables(token)
    
    if not pos_tables:
        raise HTTPException(status_code=503, detail="Unable to fetch tables from POS")
    
    # Transform to simplified format - only include Tables (rtype = "TB"), not Rooms (RM)
    tables = []
    for table in pos_tables:
        if table.get("status") == 1 and table.get("rtype") == "TB":
            tables.append({
                "id": str(table.get("id")),
                "table_no": table.get("table_no", ""),
                "title": table.get("title", ""),
                "waiter": f"{table.get('f_name', '') or ''} {table.get('l_name', '') or ''}".strip()
            })
    
    # Sort tables by table_no
    tables.sort(key=lambda x: x["table_no"])
    return {"tables": tables, "source": "pos"}


# POS restaurant config (should match the POS account)
POS_RESTAURANT_ID = "478"
POS_RESTAURANT_NAME = "18march"
POS_WAITER_ID = "1703"


async def send_order_to_pos(order: Order, order_input: OrderCreate, token: str) -> dict:
    """Send order to POS API using place-order-and-payment endpoint"""
    import json
    
    if not token:
        logger.warning("No POS token available for order submission")
        return {"success": False, "error": "No POS token"}
    
    try:
        # Build cart items for POS
        pos_cart = []
        for item in order_input.items:
            food_amount = float(item.price * item.quantity)
            pos_cart.append({
                "food_id": int(item.item_id),
                "variant": "",
                "add_on_ids": [],
                "food_level_notes": item.special_instructions or "",
                "add_on_qtys": [],
                "variations": [],
                "add_ons": [],
                "station": "OTHER",
                "quantity": item.quantity,
                "food_amount": food_amount,
                "variation_amount": 0.0,
                "addon_amount": 0.0,
                "gst_amount": 0.0,
                "vat_amount": 0.0,
                "discount_amount": 0.0,
                "service_charge": 0.0
            })
        
        # Calculate order totals
        subtotal = float(order_input.subtotal or order_input.total)
        total_gst = round(float(order_input.cgst or 0) + float(order_input.sgst or 0), 2)
        total_amount = round(float(order_input.total), 2)
        discount = round(float(order_input.discount or 0), 2)
        
        # Build POS order payload
        pos_data = {
            "restaurant_id": POS_RESTAURANT_ID,
            "user_id": "",
            "cart": pos_cart,
            "waiter_id": POS_WAITER_ID,
            "payment_method": "TAB",
            "paid_room": "",
            "payment_status": "success",
            "cust_email": "",
            "payment_type": "prepaid",
            "order_note": "",
            "delivery_charge": "0.0",
            "tax_amount": total_gst,
            "order_sub_total_amount": subtotal,
            "order_amount": total_amount,
            "vat_tax": 0.0,
            "gst_tax": total_gst,
            "address_id": "",
            "print_kot": "Yes",
            "self_discount": 0.0,
            "order_type": "pos",
            "table_id": str(order_input.table_id or "0"),
            "tip_amount": "0",
            "order_discount": discount,
            "cust_mobile": order_input.customer_mobile or "",
            "cust_name": order_input.customer_name or "",
            "restaurant_name": POS_RESTAURANT_NAME,
            "service_tax": 0,
            "transaction_id": "",
            "room_id": "",
            "service_gst_tax_amount": 0.0,
            "round_up": 0.0,
            "tip_tax_amount": 0.0
        }
        
        logger.info(f"POS Order Payload: {json.dumps(pos_data, indent=2)}")
        
        async with httpx.AsyncClient() as client_http:
            response = await client_http.post(
                f"{POS_API_V2_URL}/vendoremployee/pos/place-order-and-payment",
                data={"data": json.dumps(pos_data)},
                headers={
                    "Authorization": f"Bearer {token}",
                    "X-localization": "en"
                },
                timeout=30.0
            )
            
            logger.info(f"POS Order Response Status: {response.status_code}")
            
            try:
                result = response.json()
                logger.info(f"POS Order Response JSON: {result}")
            except:
                result = {"raw_response": response.text[:500]}
                logger.info(f"POS Order Response Text: {response.text[:500]}")
            
            if response.status_code == 200:
                if isinstance(result, dict) and (result.get("message") or result.get("order_id")):
                    return {"success": True, "data": result}
                if isinstance(result, dict) and result.get("errors"):
                    return {"success": False, "error": str(result.get("errors")), "data": result}
                return {"success": True, "data": result}
            else:
                logger.error(f"POS Order Failed: Status {response.status_code}")
                return {"success": False, "error": str(result), "status_code": response.status_code}
                
    except Exception as e:
        logger.error(f"POS Order Error: {e}")
        import traceback
        logger.error(f"POS Order Traceback: {traceback.format_exc()}")
        return {"success": False, "error": str(e)}


@api_router.post("/orders", response_model=Order)
async def create_order(order_input: OrderCreate, authorization: Optional[str] = Header(None)):
    token = get_token_from_header(authorization)
    
    if not token:
        raise HTTPException(status_code=401, detail="Authorization token required")
    
    order = Order(**order_input.model_dump())
    
    # Send order to POS API
    pos_result = await send_order_to_pos(order, order_input, token)
    
    if pos_result.get("success"):
        order.status = "confirmed"
        pos_data = pos_result.get("data", {})
        if isinstance(pos_data, dict):
            pos_order_id = pos_data.get("order_id") or pos_data.get("id")
            if pos_order_id:
                order.pos_order_id = str(pos_order_id)
                # Use POS order_id as the display ID
                order.id = str(pos_order_id)
        logger.info(f"Order {order.id} sent to POS successfully, POS Order ID: {order.pos_order_id}")
    else:
        order.status = "pending_pos_sync"
        logger.warning(f"Order {order.id} failed to sync with POS: {pos_result.get('error')}")
    
    # Convert to dict for MongoDB
    order_dict = order.model_dump()
    order_dict['created_at'] = order_dict['created_at'].isoformat()
    order_dict['pos_sync_result'] = pos_result
    
    # Save to database
    await db.orders.insert_one(order_dict)
    
    return order

@api_router.get("/config/branding", response_model=BrandingConfig)
async def get_branding():
    # In production, this would come from database or external API
    return BrandingConfig()


# Login Models
class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    token: str
    role_name: Optional[str] = None
    role: List[str] = []
    firebase_token: Optional[str] = None
    first_login: Optional[str] = None

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """Proxy login request to POS API"""
    try:
        async with httpx.AsyncClient() as client_http:
            response = await client_http.post(
                f"{POS_API_BASE_URL}/auth/vendoremployee/login",
                json={"email": request.email, "password": request.password},
                headers={"Content-Type": "application/json"},
                timeout=30.0
            )
            
            if response.status_code == 200:
                data = response.json()
                return LoginResponse(
                    token=data.get("token", ""),
                    role_name=data.get("role_name"),
                    role=data.get("role", []),
                    firebase_token=data.get("firebase_token"),
                    first_login=data.get("first_login")
                )
            elif response.status_code == 401:
                raise HTTPException(status_code=401, detail="Invalid email or password")
            else:
                raise HTTPException(status_code=response.status_code, detail="Login failed")
    except httpx.RequestError as e:
        logger.error(f"POS API request error: {e}")
        raise HTTPException(status_code=503, detail="Unable to connect to authentication service")


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
