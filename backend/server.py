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
        "id": "hot-breakfast",
        "name": "Hot Breakfast",
        "image": "https://images.unsplash.com/photo-1768406041776-c5460d9fd638?crop=entropy&cs=srgb&fm=jpg&q=85"
    },
    {
        "id": "bakery",
        "name": "Bakery & Pastry",
        "image": "https://images.pexels.com/photos/14686507/pexels-photo-14686507.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
    },
    {
        "id": "healthy",
        "name": "Fruits & Healthy",
        "image": "https://images.pexels.com/photos/7937384/pexels-photo-7937384.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
    },
    {
        "id": "beverages",
        "name": "Beverages",
        "image": "https://images.unsplash.com/photo-1718795903419-2bc5bba08d2f?crop=entropy&cs=srgb&fm=jpg&q=85"
    }
]

# Mock data for menu items
MENU_ITEMS = [
    # Hot Breakfast
    {"id": "1", "name": "Scrambled Eggs", "description": "Fluffy scrambled eggs with herbs", "price": 12.99, "image": "https://images.unsplash.com/photo-1525351326368-efbb5cb6814d?w=400", "category": "hot-breakfast"},
    {"id": "2", "name": "Pancakes", "description": "Golden pancakes with maple syrup", "price": 14.99, "image": "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400", "category": "hot-breakfast"},
    {"id": "3", "name": "French Toast", "description": "Classic French toast with berries", "price": 13.99, "image": "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400", "category": "hot-breakfast"},
    {"id": "4", "name": "Eggs Benedict", "description": "Poached eggs on English muffin", "price": 16.99, "image": "https://images.unsplash.com/photo-1608039755401-742074f0548d?w=400", "category": "hot-breakfast"},
    {"id": "5", "name": "Omelette", "description": "Three-egg omelette with your choice", "price": 15.99, "image": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400", "category": "hot-breakfast"},
    {"id": "6", "name": "Waffles", "description": "Belgian waffles with fresh cream", "price": 14.99, "image": "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=400", "category": "hot-breakfast"},
    
    # Bakery
    {"id": "7", "name": "Croissant", "description": "Buttery French croissant", "price": 5.99, "image": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400", "category": "bakery"},
    {"id": "8", "name": "Danish Pastry", "description": "Assorted Danish pastries", "price": 6.99, "image": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400", "category": "bakery"},
    {"id": "9", "name": "Muffin", "description": "Freshly baked muffins", "price": 4.99, "image": "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=400", "category": "bakery"},
    {"id": "10", "name": "Bagel", "description": "Toasted bagel with cream cheese", "price": 5.99, "image": "https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=400", "category": "bakery"},
    {"id": "11", "name": "Scone", "description": "English scone with jam", "price": 5.49, "image": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400", "category": "bakery"},
    {"id": "12", "name": "Cinnamon Roll", "description": "Sweet cinnamon roll with icing", "price": 6.99, "image": "https://images.unsplash.com/photo-1601879653910-1b7b20f7b836?w=400", "category": "bakery"},
    
    # Healthy
    {"id": "13", "name": "Fresh Fruit Bowl", "description": "Seasonal fresh fruit selection", "price": 9.99, "image": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400", "category": "healthy"},
    {"id": "14", "name": "Yogurt Parfait", "description": "Greek yogurt with granola", "price": 8.99, "image": "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400", "category": "healthy"},
    {"id": "15", "name": "Smoothie Bowl", "description": "Acai smoothie bowl with toppings", "price": 11.99, "image": "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400", "category": "healthy"},
    {"id": "16", "name": "Oatmeal", "description": "Steel-cut oats with fruits", "price": 7.99, "image": "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=400", "category": "healthy"},
    {"id": "17", "name": "Avocado Toast", "description": "Smashed avocado on sourdough", "price": 12.99, "image": "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=400", "category": "healthy"},
    {"id": "18", "name": "Chia Pudding", "description": "Overnight chia with berries", "price": 8.99, "image": "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400", "category": "healthy"},
    
    # Beverages
    {"id": "19", "name": "Fresh Orange Juice", "description": "Freshly squeezed orange juice", "price": 5.99, "image": "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400", "category": "beverages"},
    {"id": "20", "name": "Cappuccino", "description": "Italian cappuccino", "price": 4.99, "image": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400", "category": "beverages"},
    {"id": "21", "name": "Latte", "description": "Smooth café latte", "price": 4.99, "image": "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400", "category": "beverages"},
    {"id": "22", "name": "Espresso", "description": "Double shot espresso", "price": 3.99, "image": "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400", "category": "beverages"},
    {"id": "23", "name": "Tea Selection", "description": "Premium tea varieties", "price": 3.99, "image": "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400", "category": "beverages"},
    {"id": "24", "name": "Hot Chocolate", "description": "Rich hot chocolate", "price": 4.99, "image": "https://images.unsplash.com/photo-1517578239113-b03992dcdd25?w=400", "category": "beverages"}
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