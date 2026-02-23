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
    primary_color: str = "#177DAA"
    accent_color: str = "#62B5E5"
    logo_url: Optional[str] = None
    restaurant_name: str = "Hotel Lumiere"


# Common variations/add-ons
DOSA_VARIATIONS = [
    {"id": "plain", "name": "PLAIN", "price": 0.0},
    {"id": "butter", "name": "BUTTER", "price": 1.0},
    {"id": "cheese", "name": "CHEESE", "price": 2.0},
    {"id": "masala", "name": "MASALA", "price": 2.0},
    {"id": "masala_cheese", "name": "MASALA CHEESE", "price": 3.0},
    {"id": "mysore", "name": "MYSORE", "price": 1.5},
    {"id": "ghee", "name": "GHEE", "price": 1.5},
    {"id": "crispy", "name": "CRISPY", "price": 0.0},
    {"id": "podi", "name": "PODI", "price": 1.0},
    {"id": "onion", "name": "ONION", "price": 1.0},
    {"id": "chilli", "name": "CHILLI", "price": 0.5},
    {"id": "no_chilli", "name": "NO CHILLI", "price": 0.0},
    {"id": "paper", "name": "PAPER", "price": 0.5},
    {"id": "ragi", "name": "RAGI", "price": 1.0},
    {"id": "jain", "name": "JAIN", "price": 0.0},
    {"id": "less_oil", "name": "LESS OIL", "price": 0.0},
    {"id": "no_oil", "name": "NO OIL", "price": 0.0},
]

EGG_VARIATIONS = [
    {"id": "plain", "name": "PLAIN", "price": 0.0},
    {"id": "cheese", "name": "CHEESE", "price": 2.0},
    {"id": "butter", "name": "BUTTER", "price": 1.0},
    {"id": "onion", "name": "ONION", "price": 0.5},
    {"id": "tomato", "name": "TOMATO", "price": 0.5},
    {"id": "capsicum", "name": "CAPSICUM", "price": 1.0},
    {"id": "mushroom", "name": "MUSHROOM", "price": 2.0},
    {"id": "masala", "name": "MASALA", "price": 1.0},
    {"id": "less_spicy", "name": "LESS SPICY", "price": 0.0},
    {"id": "extra_spicy", "name": "EXTRA SPICY", "price": 0.0},
]

PARATHA_VARIATIONS = [
    {"id": "plain", "name": "PLAIN", "price": 0.0},
    {"id": "butter", "name": "BUTTER", "price": 1.0},
    {"id": "ghee", "name": "GHEE", "price": 1.5},
    {"id": "cheese", "name": "CHEESE", "price": 2.0},
    {"id": "extra_stuffing", "name": "EXTRA STUFFING", "price": 2.0},
    {"id": "jain", "name": "JAIN", "price": 0.0},
    {"id": "less_oil", "name": "LESS OIL", "price": 0.0},
    {"id": "no_oil", "name": "NO OIL", "price": 0.0},
]

WAFFLES_VARIATIONS = [
    {"id": "plain", "name": "PLAIN", "price": 0.0},
    {"id": "extra_chocolate", "name": "EXTRA CHOCOLATE", "price": 2.0},
    {"id": "extra_cream", "name": "EXTRA CREAM", "price": 1.5},
    {"id": "ice_cream", "name": "ICE CREAM", "price": 3.0},
    {"id": "nuts", "name": "NUTS", "price": 1.5},
    {"id": "honey", "name": "HONEY", "price": 1.0},
    {"id": "maple_syrup", "name": "MAPLE SYRUP", "price": 1.0},
    {"id": "berries", "name": "BERRIES", "price": 2.0},
]

# Mock data for menu categories
CATEGORIES = [
    {
        "id": "dosa",
        "name": "DOSA",
        "image": "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400"
    },
    {
        "id": "egg",
        "name": "EGG",
        "image": "https://images.unsplash.com/photo-1525351326368-efbb5cb6814d?w=400"
    },
    {
        "id": "paratha",
        "name": "PARATHA",
        "image": "https://images.unsplash.com/photo-1630383249896-424e482df921?w=400"
    },
    {
        "id": "waffles",
        "name": "WAFFLES",
        "image": "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=400"
    }
]

# Mock data for menu items
MENU_ITEMS = [
    # DOSA
    {"id": "1", "name": "Plain Dosa", "description": "Classic South Indian crispy dosa", "price": 8.99, "image": "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400", "category": "dosa", "variations": DOSA_VARIATIONS, "calories": 168, "portion_size": "200 gm", "allergens": ["Gluten"]},
    {"id": "2", "name": "Masala Dosa", "description": "Crispy dosa filled with spiced potato", "price": 10.99, "image": "https://images.unsplash.com/photo-1694849224835-6187a8d2d6e9?w=400", "category": "dosa", "variations": DOSA_VARIATIONS, "calories": 250, "portion_size": "250 gm", "allergens": ["Gluten"]},
    {"id": "3", "name": "Mysore Masala Dosa", "description": "Spicy red chutney dosa with potato", "price": 11.99, "image": "https://images.unsplash.com/photo-1630383249896-424e482df921?w=400", "category": "dosa", "variations": DOSA_VARIATIONS, "calories": 280, "portion_size": "280 gm", "allergens": ["Gluten", "Spicy"]},
    {"id": "4", "name": "Ghee Roast Dosa", "description": "Crispy dosa roasted in pure ghee", "price": 12.99, "image": "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400", "category": "dosa", "variations": DOSA_VARIATIONS, "calories": 300, "portion_size": "220 gm", "allergens": ["Gluten", "Dairy"]},
    {"id": "5", "name": "Cheese Dosa", "description": "Dosa topped with melted cheese", "price": 13.99, "image": "https://images.unsplash.com/photo-1694849224835-6187a8d2d6e9?w=400", "category": "dosa", "variations": DOSA_VARIATIONS, "calories": 350, "portion_size": "300 gm", "allergens": ["Gluten", "Dairy"]},
    {"id": "6", "name": "Rava Dosa", "description": "Crispy semolina dosa", "price": 9.99, "image": "https://images.unsplash.com/photo-1630383249896-424e482df921?w=400", "category": "dosa", "variations": DOSA_VARIATIONS, "calories": 180, "portion_size": "180 gm", "allergens": ["Gluten"]},
    
    # EGG
    {"id": "7", "name": "Scrambled Eggs", "description": "Fluffy scrambled eggs with herbs", "price": 7.99, "image": "https://images.unsplash.com/photo-1525351326368-efbb5cb6814d?w=400", "category": "egg", "variations": EGG_VARIATIONS, "calories": 140, "portion_size": "100 gm", "allergens": ["Eggs"]},
    {"id": "8", "name": "Omelette", "description": "Three-egg omelette with vegetables", "price": 8.99, "image": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400", "category": "egg", "variations": EGG_VARIATIONS, "calories": 210, "portion_size": "150 gm", "allergens": ["Eggs"]},
    {"id": "9", "name": "Eggs Benedict", "description": "Poached eggs on English muffin", "price": 12.99, "image": "https://images.unsplash.com/photo-1608039755401-742074f0548d?w=400", "category": "egg", "variations": EGG_VARIATIONS, "calories": 450, "portion_size": "250 gm", "allergens": ["Eggs", "Gluten", "Dairy"]},
    {"id": "10", "name": "Boiled Eggs", "description": "Perfectly boiled eggs (2 pcs)", "price": 5.99, "image": "https://images.unsplash.com/photo-1587486937736-e6c447887f99?w=400", "category": "egg", "variations": EGG_VARIATIONS, "calories": 155, "portion_size": "100 gm", "allergens": ["Eggs"]},
    {"id": "11", "name": "Egg Bhurji", "description": "Indian style spiced scrambled eggs", "price": 9.99, "image": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400", "category": "egg", "variations": EGG_VARIATIONS, "calories": 200, "portion_size": "120 gm", "allergens": ["Eggs", "Spicy"]},
    {"id": "12", "name": "Bull's Eye", "description": "Fried eggs sunny side up (2 pcs)", "price": 7.99, "image": "https://images.unsplash.com/photo-1525351326368-efbb5cb6814d?w=400", "category": "egg", "variations": EGG_VARIATIONS, "calories": 180, "portion_size": "100 gm", "allergens": ["Eggs"]},
    
    # PARATHA
    {"id": "13", "name": "Plain Paratha", "description": "Whole wheat layered flatbread", "price": 5.99, "image": "https://images.unsplash.com/photo-1630383249896-424e482df921?w=400", "category": "paratha", "variations": PARATHA_VARIATIONS, "calories": 120, "portion_size": "80 gm", "allergens": ["Gluten"]},
    {"id": "14", "name": "Aloo Paratha", "description": "Stuffed potato paratha", "price": 7.99, "image": "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=400", "category": "paratha", "variations": PARATHA_VARIATIONS, "calories": 200, "portion_size": "120 gm", "allergens": ["Gluten"]},
    {"id": "15", "name": "Paneer Paratha", "description": "Stuffed cottage cheese paratha", "price": 9.99, "image": "https://images.unsplash.com/photo-1630383249896-424e482df921?w=400", "category": "paratha", "variations": PARATHA_VARIATIONS, "calories": 250, "portion_size": "150 gm", "allergens": ["Gluten", "Dairy"]},
    {"id": "16", "name": "Gobi Paratha", "description": "Stuffed cauliflower paratha", "price": 8.99, "image": "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=400", "category": "paratha", "variations": PARATHA_VARIATIONS, "calories": 180, "portion_size": "130 gm", "allergens": ["Gluten"]},
    {"id": "17", "name": "Mix Veg Paratha", "description": "Mixed vegetable stuffed paratha", "price": 9.99, "image": "https://images.unsplash.com/photo-1630383249896-424e482df921?w=400", "category": "paratha", "variations": PARATHA_VARIATIONS, "calories": 220, "portion_size": "140 gm", "allergens": ["Gluten"]},
    {"id": "18", "name": "Laccha Paratha", "description": "Multi-layered crispy paratha", "price": 6.99, "image": "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=400", "category": "paratha", "variations": PARATHA_VARIATIONS, "calories": 150, "portion_size": "90 gm", "allergens": ["Gluten"]},
    
    # WAFFLES
    {"id": "19", "name": "Classic Waffle", "description": "Belgian waffle with maple syrup", "price": 10.99, "image": "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=400", "category": "waffles", "variations": WAFFLES_VARIATIONS, "calories": 290, "portion_size": "180 gm", "allergens": ["Gluten", "Eggs", "Dairy"]},
    {"id": "20", "name": "Chocolate Waffle", "description": "Waffle with chocolate sauce", "price": 12.99, "image": "https://images.unsplash.com/photo-1568051243851-f9b136146e97?w=400", "category": "waffles", "variations": WAFFLES_VARIATIONS, "calories": 380, "portion_size": "200 gm", "allergens": ["Gluten", "Eggs", "Dairy"]},
    {"id": "21", "name": "Berry Waffle", "description": "Waffle with fresh berries", "price": 13.99, "image": "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=400", "category": "waffles", "variations": WAFFLES_VARIATIONS, "calories": 320, "portion_size": "190 gm", "allergens": ["Gluten", "Eggs", "Dairy"]},
    {"id": "22", "name": "Nutella Waffle", "description": "Waffle with Nutella spread", "price": 14.99, "image": "https://images.unsplash.com/photo-1568051243851-f9b136146e97?w=400", "category": "waffles", "variations": WAFFLES_VARIATIONS, "calories": 450, "portion_size": "220 gm", "allergens": ["Gluten", "Eggs", "Dairy", "Nuts"]},
    {"id": "23", "name": "Savory Waffle", "description": "Waffle with cheese and herbs", "price": 11.99, "image": "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=400", "category": "waffles", "variations": WAFFLES_VARIATIONS, "calories": 310, "portion_size": "170 gm", "allergens": ["Gluten", "Eggs", "Dairy"]},
    {"id": "24", "name": "Ice Cream Waffle", "description": "Waffle with vanilla ice cream", "price": 15.99, "image": "https://images.unsplash.com/photo-1568051243851-f9b136146e97?w=400", "category": "waffles", "variations": WAFFLES_VARIATIONS, "calories": 520, "portion_size": "250 gm", "allergens": ["Gluten", "Eggs", "Dairy"]}
]


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
        logger.warning("No POS token available, using fallback menu")
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
    # POS format: {"name": "choice of", "type": "single", "min": 0, "max": 0, "required": "on", "values": [...]}
    variation_groups = []
    for variation_group in food.get("variation", []):
        if isinstance(variation_group, dict):
            group_name = variation_group.get("name", "Choice")
            group_type = variation_group.get("type", "single")  # single or multi
            required = variation_group.get("required", "off") == "on"
            min_select = variation_group.get("min", 0)
            max_select = variation_group.get("max", 0)
            
            # Convert min/max to int if they're strings
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
    
    # Transform addons as a separate group (always optional, multiple selection)
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
    
    # Flatten for backward compatibility (old variations array)
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
    
    # Calculate final price following strict order:
    # If complementary = "yes" then final price = 0 (ignore discount and tax)
    if is_complementary:
        final_price = 0
        discount = 0
        tax_amount = 0
    else:
        # Apply discount first
        price_after_discount = base_price - discount
        # Then calculate tax
        tax_amount = (price_after_discount * tax_percent) / 100
        # Final price = price after discount + tax
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
        "image": food.get("image", "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400"),
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
    """Get categories from POS API or fallback to hardcoded"""
    token = get_token_from_header(authorization)
    pos_foods = await fetch_pos_menu(token)
    
    if pos_foods:
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
                    "image": food.get("image", "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400")
                }
        
        # Return sorted by name
        return sorted(categories_dict.values(), key=lambda x: x["name"])
    
    # Fallback to hardcoded
    return CATEGORIES


@api_router.get("/menu/items")
async def get_menu_items(category: Optional[str] = None, authorization: Optional[str] = Header(None)):
    """Get menu items from POS API or fallback to hardcoded"""
    token = get_token_from_header(authorization)
    pos_foods = await fetch_pos_menu(token)
    
    if pos_foods:
        # Transform POS foods to our format
        items = [transform_pos_food_to_menu_item(food) for food in pos_foods if food.get("status", 1) == 1]
        
        if category:
            items = [item for item in items if item["category"] == category]
        
        return items
    
    # Fallback to hardcoded
    if category:
        return [item for item in MENU_ITEMS if item["category"] == category]
    return MENU_ITEMS


# Tables cache
tables_cache = {"data": None, "expires": None, "token": None}

async def fetch_pos_tables(token: str):
    """Fetch tables from POS API using the provided token"""
    now = datetime.now(timezone.utc)
    
    # Check cache (cache for 5 minutes) - also check if same token
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
    """Get tables from POS API"""
    token = get_token_from_header(authorization)
    pos_tables = await fetch_pos_tables(token)
    
    if pos_tables:
        # Transform to simplified format - only include Tables (rtype = "TB"), not Rooms (RM)
        tables = []
        for table in pos_tables:
            if table.get("status") == 1 and table.get("rtype") == "TB":  # Only active Tables
                tables.append({
                    "id": str(table.get("id")),
                    "table_no": table.get("table_no", ""),
                    "title": table.get("title", ""),
                    "waiter": f"{table.get('f_name', '') or ''} {table.get('l_name', '') or ''}".strip()
                })
        
        # Sort tables by table_no
        tables.sort(key=lambda x: x["table_no"])
        return {"tables": tables, "source": "pos"}
    
    # Fallback to hardcoded tables (1-100)
    fallback_tables = [{"id": str(i), "table_no": f"{i:02d}", "title": "", "waiter": ""} for i in range(1, 101)]
    return {"tables": fallback_tables, "source": "fallback"}


# POS restaurant config (should match the POS account)
POS_RESTAURANT_ID = "478"
POS_RESTAURANT_NAME = "18march"
POS_WAITER_ID = "1703"  # Default waiter ID


async def send_order_to_pos(order: Order, order_input: OrderCreate, token: str) -> dict:
    """Send order to POS API using place-order-and-payment endpoint"""
    import json
    
    if not token:
        logger.warning("No POS token available for order submission")
        return {"success": False, "error": "No POS token"}
    
    try:
        # Build cart items for POS - exact structure from place-order-and-payment curl
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
        
        # Build POS order payload - exact structure from working curl
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
        
        # Log the payload for debugging
        logger.info(f"POS Order Payload: {json.dumps(pos_data, indent=2)}")
        
        async with httpx.AsyncClient() as client_http:
            # POS API expects multipart/form-data with 'data' field as JSON string
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
            
            # Try to parse JSON response
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
    order = Order(**order_input.model_dump())
    
    # Send order to POS API
    pos_result = await send_order_to_pos(order, order_input, token)
    
    if pos_result.get("success"):
        order.status = "confirmed"
        # Extract POS order ID if available
        pos_data = pos_result.get("data", {})
        if isinstance(pos_data, dict):
            order.pos_order_id = str(pos_data.get("order_id", ""))
        logger.info(f"Order {order.id} sent to POS successfully")
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