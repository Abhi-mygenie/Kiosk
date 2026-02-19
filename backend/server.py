from fastapi import FastAPI, APIRouter
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


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
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

class CartItem(BaseModel):
    item_id: str
    name: str
    price: float
    quantity: int

class OrderCreate(BaseModel):
    table_number: str
    items: List[CartItem]
    total: float
    guest_name: Optional[str] = None

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    table_number: str
    items: List[CartItem]
    total: float
    guest_name: Optional[str] = None
    status: str = "pending"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BrandingConfig(BaseModel):
    primary_color: str = "#1A1A1A"
    accent_color: str = "#C5A059"
    logo_url: Optional[str] = None
    restaurant_name: str = "Hotel Lumiere"


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
    {"id": "1", "name": "Plain Dosa", "description": "Classic South Indian crispy dosa", "price": 8.99, "image": "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400", "category": "dosa"},
    {"id": "2", "name": "Masala Dosa", "description": "Crispy dosa filled with spiced potato", "price": 10.99, "image": "https://images.unsplash.com/photo-1694849224835-6187a8d2d6e9?w=400", "category": "dosa"},
    {"id": "3", "name": "Mysore Masala Dosa", "description": "Spicy red chutney dosa with potato", "price": 11.99, "image": "https://images.unsplash.com/photo-1630383249896-424e482df921?w=400", "category": "dosa"},
    {"id": "4", "name": "Ghee Roast Dosa", "description": "Crispy dosa roasted in pure ghee", "price": 12.99, "image": "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400", "category": "dosa"},
    {"id": "5", "name": "Cheese Dosa", "description": "Dosa topped with melted cheese", "price": 13.99, "image": "https://images.unsplash.com/photo-1694849224835-6187a8d2d6e9?w=400", "category": "dosa"},
    {"id": "6", "name": "Rava Dosa", "description": "Crispy semolina dosa", "price": 9.99, "image": "https://images.unsplash.com/photo-1630383249896-424e482df921?w=400", "category": "dosa"},
    
    # EGG
    {"id": "7", "name": "Scrambled Eggs", "description": "Fluffy scrambled eggs with herbs", "price": 7.99, "image": "https://images.unsplash.com/photo-1525351326368-efbb5cb6814d?w=400", "category": "egg"},
    {"id": "8", "name": "Omelette", "description": "Three-egg omelette with vegetables", "price": 8.99, "image": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400", "category": "egg"},
    {"id": "9", "name": "Eggs Benedict", "description": "Poached eggs on English muffin", "price": 12.99, "image": "https://images.unsplash.com/photo-1608039755401-742074f0548d?w=400", "category": "egg"},
    {"id": "10", "name": "Boiled Eggs", "description": "Perfectly boiled eggs (2 pcs)", "price": 5.99, "image": "https://images.unsplash.com/photo-1587486937736-e6c447887f99?w=400", "category": "egg"},
    {"id": "11", "name": "Egg Bhurji", "description": "Indian style spiced scrambled eggs", "price": 9.99, "image": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400", "category": "egg"},
    {"id": "12", "name": "Bull's Eye", "description": "Fried eggs sunny side up (2 pcs)", "price": 7.99, "image": "https://images.unsplash.com/photo-1525351326368-efbb5cb6814d?w=400", "category": "egg"},
    
    # PARATHA
    {"id": "13", "name": "Plain Paratha", "description": "Whole wheat layered flatbread", "price": 5.99, "image": "https://images.unsplash.com/photo-1630383249896-424e482df921?w=400", "category": "paratha"},
    {"id": "14", "name": "Aloo Paratha", "description": "Stuffed potato paratha", "price": 7.99, "image": "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=400", "category": "paratha"},
    {"id": "15", "name": "Paneer Paratha", "description": "Stuffed cottage cheese paratha", "price": 9.99, "image": "https://images.unsplash.com/photo-1630383249896-424e482df921?w=400", "category": "paratha"},
    {"id": "16", "name": "Gobi Paratha", "description": "Stuffed cauliflower paratha", "price": 8.99, "image": "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=400", "category": "paratha"},
    {"id": "17", "name": "Mix Veg Paratha", "description": "Mixed vegetable stuffed paratha", "price": 9.99, "image": "https://images.unsplash.com/photo-1630383249896-424e482df921?w=400", "category": "paratha"},
    {"id": "18", "name": "Laccha Paratha", "description": "Multi-layered crispy paratha", "price": 6.99, "image": "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=400", "category": "paratha"},
    
    # WAFFLES
    {"id": "19", "name": "Classic Waffle", "description": "Belgian waffle with maple syrup", "price": 10.99, "image": "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=400", "category": "waffles"},
    {"id": "20", "name": "Chocolate Waffle", "description": "Waffle with chocolate sauce", "price": 12.99, "image": "https://images.unsplash.com/photo-1568051243851-f9b136146e97?w=400", "category": "waffles"},
    {"id": "21", "name": "Berry Waffle", "description": "Waffle with fresh berries", "price": 13.99, "image": "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=400", "category": "waffles"},
    {"id": "22", "name": "Nutella Waffle", "description": "Waffle with Nutella spread", "price": 14.99, "image": "https://images.unsplash.com/photo-1568051243851-f9b136146e97?w=400", "category": "waffles"},
    {"id": "23", "name": "Savory Waffle", "description": "Waffle with cheese and herbs", "price": 11.99, "image": "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=400", "category": "waffles"},
    {"id": "24", "name": "Ice Cream Waffle", "description": "Waffle with vanilla ice cream", "price": 15.99, "image": "https://images.unsplash.com/photo-1568051243851-f9b136146e97?w=400", "category": "waffles"}
]


@api_router.get("/")
async def root():
    return {"message": "Kiosk API Ready"}

@api_router.get("/menu/categories", response_model=List[Category])
async def get_categories():
    return CATEGORIES

@api_router.get("/menu/items", response_model=List[MenuItem])
async def get_menu_items(category: Optional[str] = None):
    if category:
        return [item for item in MENU_ITEMS if item["category"] == category]
    return MENU_ITEMS

@api_router.post("/orders", response_model=Order)
async def create_order(order_input: OrderCreate):
    order = Order(**order_input.model_dump())
    
    # Convert to dict for MongoDB
    order_dict = order.model_dump()
    order_dict['created_at'] = order_dict['created_at'].isoformat()
    
    # Save to database
    await db.orders.insert_one(order_dict)
    
    # TODO: In production, send this to external POS API
    # await send_to_pos_api(order_dict)
    
    return order

@api_router.get("/config/branding", response_model=BrandingConfig)
async def get_branding():
    # In production, this would come from database or external API
    return BrandingConfig()


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()