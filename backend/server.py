from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import jwt
import bcrypt
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'arangetram-secret-key-2024')
JWT_ALGORITHM = "HS256"

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

security = HTTPBearer(auto_error=False)

# ===================== MODELS =====================

class UserBase(BaseModel):
    email: EmailStr
    name: str
    user_type: str = "user"  # user, vendor, guest

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    user_type: str
    created_at: str

class GuestCreate(BaseModel):
    name: str = "Guest"

class VendorProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    business_name: str
    category: str  # venue, catering, photographer, videographer, decorations, musicians
    description: str
    location: str
    price_range: str  # $, $$, $$$, $$$$
    price_estimate: str
    services: List[str] = []
    portfolio_images: List[str] = []
    contact_phone: str = ""
    contact_email: str = ""
    rating: float = 0.0
    review_count: int = 0
    is_active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class VendorCreate(BaseModel):
    business_name: str
    category: str
    description: str
    location: str
    price_range: str
    price_estimate: str
    services: List[str] = []
    portfolio_images: List[str] = []
    contact_phone: str = ""
    contact_email: str = ""

class VendorUpdate(BaseModel):
    business_name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    price_range: Optional[str] = None
    price_estimate: Optional[str] = None
    services: Optional[List[str]] = None
    portfolio_images: Optional[List[str]] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    is_active: Optional[bool] = None

class Event(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    event_name: str
    event_date: str
    event_time: str = ""
    guest_count: int = 100
    budget: str = "$$"
    location_preference: str = "Bay Area"
    special_requirements: str = ""
    selected_vendors: List[str] = []
    status: str = "planning"  # planning, confirmed, completed
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class EventCreate(BaseModel):
    event_name: str
    event_date: str
    event_time: str = ""
    guest_count: int = 100
    budget: str = "$$"
    location_preference: str = "Bay Area"
    special_requirements: str = ""

class EventUpdate(BaseModel):
    event_name: Optional[str] = None
    event_date: Optional[str] = None
    event_time: Optional[str] = None
    guest_count: Optional[int] = None
    budget: Optional[str] = None
    location_preference: Optional[str] = None
    special_requirements: Optional[str] = None
    selected_vendors: Optional[List[str]] = None
    status: Optional[str] = None

class BookingRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    vendor_id: str
    user_id: str
    message: str = ""
    event_date: str
    status: str = "pending"  # pending, accepted, declined
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class BookingRequestCreate(BaseModel):
    event_id: str
    vendor_id: str
    message: str = ""

class BookingRequestUpdate(BaseModel):
    status: str
    response_message: Optional[str] = None

class ChatMessage(BaseModel):
    message: str
    event_context: Optional[dict] = None

class RecommendationRequest(BaseModel):
    event_date: str
    guest_count: int = 100
    budget: str = "$$"
    location: str = "Bay Area"
    categories_needed: List[str] = []

# ===================== AUTH HELPERS =====================

def create_token(user_id: str, user_type: str) -> str:
    payload = {
        "user_id": user_id,
        "user_type": user_type,
        "exp": datetime.now(timezone.utc).timestamp() + 86400 * 7  # 7 days
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = verify_token(credentials.credentials)
    return payload

async def get_optional_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        return None
    try:
        payload = verify_token(credentials.credentials)
        return payload
    except:
        return None

# ===================== AUTH ROUTES =====================

@api_router.post("/auth/register", response_model=dict)
async def register(user: UserCreate):
    existing = await db.users.find_one({"email": user.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    hashed_password = bcrypt.hashpw(user.password.encode(), bcrypt.gensalt()).decode()
    
    user_doc = {
        "id": user_id,
        "email": user.email,
        "name": user.name,
        "password": hashed_password,
        "user_type": user.user_type,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, user.user_type)
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": user.email,
            "name": user.name,
            "user_type": user.user_type
        }
    }

@api_router.post("/auth/login", response_model=dict)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not bcrypt.checkpw(credentials.password.encode(), user["password"].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user["user_type"])
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "user_type": user["user_type"]
        }
    }

@api_router.post("/auth/guest", response_model=dict)
async def create_guest(guest: GuestCreate):
    guest_id = str(uuid.uuid4())
    guest_doc = {
        "id": guest_id,
        "email": f"guest_{guest_id[:8]}@arangetram.local",
        "name": guest.name,
        "password": "",
        "user_type": "guest",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(guest_doc)
    
    token = create_token(guest_id, "guest")
    return {
        "token": token,
        "user": {
            "id": guest_id,
            "name": guest.name,
            "user_type": "guest"
        }
    }

@api_router.get("/auth/me", response_model=dict)
async def get_me(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# ===================== VENDOR ROUTES =====================

@api_router.get("/vendors", response_model=List[dict])
async def get_vendors(
    category: Optional[str] = None,
    location: Optional[str] = None,
    price_range: Optional[str] = None,
    search: Optional[str] = None
):
    query = {"is_active": True}
    if category:
        query["category"] = category
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    if price_range:
        query["price_range"] = price_range
    if search:
        query["$or"] = [
            {"business_name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    vendors = await db.vendors.find(query, {"_id": 0}).to_list(100)
    return vendors

@api_router.get("/vendors/{vendor_id}", response_model=dict)
async def get_vendor(vendor_id: str):
    vendor = await db.vendors.find_one({"id": vendor_id}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return vendor

@api_router.post("/vendors", response_model=dict)
async def create_vendor(vendor: VendorCreate, current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "vendor":
        raise HTTPException(status_code=403, detail="Only vendors can create listings")
    
    existing = await db.vendors.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Vendor profile already exists")
    
    vendor_profile = VendorProfile(
        user_id=current_user["user_id"],
        **vendor.model_dump()
    )
    await db.vendors.insert_one(vendor_profile.model_dump())
    return vendor_profile.model_dump()

@api_router.put("/vendors/{vendor_id}", response_model=dict)
async def update_vendor(vendor_id: str, vendor: VendorUpdate, current_user: dict = Depends(get_current_user)):
    existing = await db.vendors.find_one({"id": vendor_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    if existing["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {k: v for k, v in vendor.model_dump().items() if v is not None}
    if update_data:
        await db.vendors.update_one({"id": vendor_id}, {"$set": update_data})
    
    updated = await db.vendors.find_one({"id": vendor_id}, {"_id": 0})
    return updated

@api_router.get("/vendors/my/profile", response_model=dict)
async def get_my_vendor_profile(current_user: dict = Depends(get_current_user)):
    vendor = await db.vendors.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="No vendor profile found")
    return vendor

# ===================== EVENT ROUTES =====================

@api_router.post("/events", response_model=dict)
async def create_event(event: EventCreate, current_user: dict = Depends(get_current_user)):
    event_obj = Event(
        user_id=current_user["user_id"],
        **event.model_dump()
    )
    await db.events.insert_one(event_obj.model_dump())
    return event_obj.model_dump()

@api_router.get("/events", response_model=List[dict])
async def get_my_events(current_user: dict = Depends(get_current_user)):
    events = await db.events.find({"user_id": current_user["user_id"]}, {"_id": 0}).to_list(100)
    return events

@api_router.get("/events/{event_id}", response_model=dict)
async def get_event(event_id: str, current_user: dict = Depends(get_current_user)):
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    return event

@api_router.put("/events/{event_id}", response_model=dict)
async def update_event(event_id: str, event: EventUpdate, current_user: dict = Depends(get_current_user)):
    existing = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Event not found")
    if existing["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {k: v for k, v in event.model_dump().items() if v is not None}
    if update_data:
        await db.events.update_one({"id": event_id}, {"$set": update_data})
    
    updated = await db.events.find_one({"id": event_id}, {"_id": 0})
    return updated

@api_router.post("/events/{event_id}/vendors/{vendor_id}")
async def add_vendor_to_event(event_id: str, vendor_id: str, current_user: dict = Depends(get_current_user)):
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    vendor = await db.vendors.find_one({"id": vendor_id}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    selected_vendors = event.get("selected_vendors", [])
    if vendor_id not in selected_vendors:
        selected_vendors.append(vendor_id)
        await db.events.update_one({"id": event_id}, {"$set": {"selected_vendors": selected_vendors}})
    
    return {"message": "Vendor added to event"}

@api_router.delete("/events/{event_id}/vendors/{vendor_id}")
async def remove_vendor_from_event(event_id: str, vendor_id: str, current_user: dict = Depends(get_current_user)):
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    selected_vendors = event.get("selected_vendors", [])
    if vendor_id in selected_vendors:
        selected_vendors.remove(vendor_id)
        await db.events.update_one({"id": event_id}, {"$set": {"selected_vendors": selected_vendors}})
    
    return {"message": "Vendor removed from event"}

# ===================== BOOKING ROUTES =====================

@api_router.post("/bookings", response_model=dict)
async def create_booking(booking: BookingRequestCreate, current_user: dict = Depends(get_current_user)):
    event = await db.events.find_one({"id": booking.event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    vendor = await db.vendors.find_one({"id": booking.vendor_id}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    booking_obj = BookingRequest(
        event_id=booking.event_id,
        vendor_id=booking.vendor_id,
        user_id=current_user["user_id"],
        message=booking.message,
        event_date=event["event_date"]
    )
    await db.bookings.insert_one(booking_obj.model_dump())
    return booking_obj.model_dump()

@api_router.get("/bookings/user", response_model=List[dict])
async def get_user_bookings(current_user: dict = Depends(get_current_user)):
    bookings = await db.bookings.find({"user_id": current_user["user_id"]}, {"_id": 0}).to_list(100)
    
    # Enrich with vendor and event info
    for booking in bookings:
        vendor = await db.vendors.find_one({"id": booking["vendor_id"]}, {"_id": 0})
        event = await db.events.find_one({"id": booking["event_id"]}, {"_id": 0})
        booking["vendor"] = vendor
        booking["event"] = event
    
    return bookings

@api_router.get("/bookings/vendor", response_model=List[dict])
async def get_vendor_bookings(current_user: dict = Depends(get_current_user)):
    vendor = await db.vendors.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    bookings = await db.bookings.find({"vendor_id": vendor["id"]}, {"_id": 0}).to_list(100)
    
    # Enrich with user and event info
    for booking in bookings:
        user = await db.users.find_one({"id": booking["user_id"]}, {"_id": 0, "password": 0})
        event = await db.events.find_one({"id": booking["event_id"]}, {"_id": 0})
        booking["user"] = user
        booking["event"] = event
    
    return bookings

@api_router.put("/bookings/{booking_id}", response_model=dict)
async def update_booking(booking_id: str, update: BookingRequestUpdate, current_user: dict = Depends(get_current_user)):
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check if vendor owns this booking
    vendor = await db.vendors.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    if not vendor or vendor["id"] != booking["vendor_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {
        "status": update.status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.bookings.update_one({"id": booking_id}, {"$set": update_data})
    
    updated = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    return updated

# ===================== AI RECOMMENDATION ROUTES =====================

@api_router.post("/ai/chat")
async def ai_chat(chat: ChatMessage, current_user: dict = Depends(get_optional_user)):
    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        # Get vendors from DB for context
        vendors = await db.vendors.find({"is_active": True}, {"_id": 0}).to_list(50)
        vendor_context = "\n".join([
            f"- {v['business_name']} ({v['category']}): {v['description'][:100]}... Price: {v['price_range']}, Location: {v['location']}"
            for v in vendors[:20]
        ])
        
        event_context = ""
        if chat.event_context:
            event_context = f"""
Event Details:
- Date: {chat.event_context.get('event_date', 'Not specified')}
- Guests: {chat.event_context.get('guest_count', 'Not specified')}
- Budget: {chat.event_context.get('budget', 'Not specified')}
- Location: {chat.event_context.get('location', 'Bay Area')}
"""
        
        system_message = f"""You are an expert Arangetram event planning assistant. Arangetram is a classical Indian dance debut performance, typically Bharatanatyam.

Your role is to help users plan their Arangetram by:
1. Understanding their requirements (date, budget, guest count, preferences)
2. Recommending vendors from our Bay Area database
3. Explaining the typical components of an Arangetram (venue, catering, musicians, photographer, videographer, decorations)
4. Providing culturally informed advice

Available vendors in our database:
{vendor_context}

{event_context}

Be helpful, warm, and culturally sensitive. Keep responses concise but informative. If asked about specific vendor categories, recommend from the available vendors."""

        session_id = current_user["user_id"] if current_user else str(uuid.uuid4())
        
        llm_chat = LlmChat(
            api_key=api_key,
            session_id=session_id,
            system_message=system_message
        ).with_model("gemini", "gemini-3-flash-preview")
        
        user_message = UserMessage(text=chat.message)
        response = await llm_chat.send_message(user_message)
        
        return {"response": response}
    except Exception as e:
        logger.error(f"AI chat error: {str(e)}")
        return {"response": "I apologize, but I'm having trouble processing your request. Please try again or browse our vendor categories directly."}

@api_router.post("/ai/recommendations")
async def get_recommendations(request: RecommendationRequest, current_user: dict = Depends(get_optional_user)):
    try:
        recommendations = {}
        
        for category in request.categories_needed:
            query = {
                "is_active": True,
                "category": category,
                "location": {"$regex": request.location, "$options": "i"}
            }
            
            # Filter by price range if budget is specified
            price_order = {"$": 1, "$$": 2, "$$$": 3, "$$$$": 4}
            max_price = price_order.get(request.budget, 4)
            
            vendors = await db.vendors.find(query, {"_id": 0}).to_list(10)
            
            # Sort by rating and filter by price
            filtered_vendors = [
                v for v in vendors 
                if price_order.get(v.get("price_range", "$$"), 2) <= max_price
            ]
            filtered_vendors.sort(key=lambda x: x.get("rating", 0), reverse=True)
            
            recommendations[category] = filtered_vendors[:3]  # Top 3 per category
        
        return {"recommendations": recommendations}
    except Exception as e:
        logger.error(f"Recommendation error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get recommendations")

# ===================== CATEGORIES =====================

@api_router.get("/categories")
async def get_categories():
    return {
        "categories": [
            {"id": "venue", "name": "Venues", "icon": "Building2", "description": "Performance halls and event spaces"},
            {"id": "catering", "name": "Catering", "icon": "UtensilsCrossed", "description": "Traditional Indian cuisine"},
            {"id": "photographer", "name": "Photographers", "icon": "Camera", "description": "Capture your special moments"},
            {"id": "videographer", "name": "Videographers", "icon": "Video", "description": "Professional video coverage"},
            {"id": "decorations", "name": "Decorations", "icon": "Flower2", "description": "Stage and venue decor"},
            {"id": "musicians", "name": "Musicians", "icon": "Music", "description": "Live Carnatic music"}
        ]
    }

# ===================== SEED DATA =====================

@api_router.post("/seed")
async def seed_data():
    # Check if already seeded
    existing = await db.vendors.count_documents({})
    if existing > 0:
        return {"message": "Database already seeded", "vendor_count": existing}
    
    # Seed vendors
    vendors_data = [
        # Venues
        {
            "id": str(uuid.uuid4()),
            "user_id": "system",
            "business_name": "Sunnyvale Hindu Temple Hall",
            "category": "venue",
            "description": "Beautiful traditional hall with authentic temple architecture. Perfect for Arangetrams with excellent acoustics and stage setup. Capacity up to 300 guests.",
            "location": "Sunnyvale, CA",
            "price_range": "$$",
            "price_estimate": "$2,000 - $3,500",
            "services": ["Stage setup", "Sound system", "Parking", "Green room"],
            "portfolio_images": ["https://images.pexels.com/photos/16985130/pexels-photo-16985130.jpeg"],
            "contact_phone": "(408) 555-0101",
            "contact_email": "events@sunnyvaletemple.org",
            "rating": 4.8,
            "review_count": 45,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": "system",
            "business_name": "Fremont Cultural Center",
            "category": "venue",
            "description": "Modern auditorium with state-of-the-art lighting and sound. Professional stage perfect for classical dance performances. Seats 400.",
            "location": "Fremont, CA",
            "price_range": "$$$",
            "price_estimate": "$4,000 - $6,000",
            "services": ["Professional lighting", "Sound engineer", "Recording booth", "Large stage"],
            "portfolio_images": ["https://images.pexels.com/photos/16985130/pexels-photo-16985130.jpeg"],
            "contact_phone": "(510) 555-0202",
            "contact_email": "booking@fremontcc.com",
            "rating": 4.9,
            "review_count": 62,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": "system",
            "business_name": "San Jose Community Hall",
            "category": "venue",
            "description": "Affordable community space with good facilities. Ideal for intimate Arangetrams. Capacity 150 guests.",
            "location": "San Jose, CA",
            "price_range": "$",
            "price_estimate": "$800 - $1,500",
            "services": ["Basic sound", "Chairs and tables", "Kitchen access"],
            "portfolio_images": ["https://images.pexels.com/photos/16985130/pexels-photo-16985130.jpeg"],
            "contact_phone": "(408) 555-0303",
            "contact_email": "rentals@sjcommunity.org",
            "rating": 4.3,
            "review_count": 28,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        # Catering
        {
            "id": str(uuid.uuid4()),
            "user_id": "system",
            "business_name": "Saravana Bhavan Catering",
            "category": "catering",
            "description": "Authentic South Indian vegetarian catering. Specializing in traditional Tamil Nadu cuisine perfect for Arangetram celebrations.",
            "location": "Sunnyvale, CA",
            "price_range": "$$",
            "price_estimate": "$25 - $35 per person",
            "services": ["Full buffet setup", "Live dosa counter", "Traditional sweets", "Servers included"],
            "portfolio_images": ["https://images.pexels.com/photos/9198596/pexels-photo-9198596.jpeg"],
            "contact_phone": "(408) 555-0404",
            "contact_email": "catering@saravanabhavan.com",
            "rating": 4.7,
            "review_count": 89,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": "system",
            "business_name": "Anjappar Chettinad Catering",
            "category": "catering",
            "description": "Premium Chettinad cuisine with authentic spices. Non-vegetarian and vegetarian options available.",
            "location": "Fremont, CA",
            "price_range": "$$$",
            "price_estimate": "$40 - $55 per person",
            "services": ["Customized menu", "Premium presentation", "Event coordination", "Cleanup included"],
            "portfolio_images": ["https://images.pexels.com/photos/9198596/pexels-photo-9198596.jpeg"],
            "contact_phone": "(510) 555-0505",
            "contact_email": "events@anjappar.com",
            "rating": 4.8,
            "review_count": 56,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        # Photographers
        {
            "id": str(uuid.uuid4()),
            "user_id": "system",
            "business_name": "Nritya Frames Photography",
            "category": "photographer",
            "description": "Specialized in classical dance photography. Expert at capturing mudras and expressions. 10+ years of Arangetram experience.",
            "location": "Cupertino, CA",
            "price_range": "$$$",
            "price_estimate": "$2,500 - $4,000",
            "services": ["Full event coverage", "Edited photos", "Online gallery", "Print package available"],
            "portfolio_images": ["https://images.pexels.com/photos/34717625/pexels-photo-34717625.jpeg"],
            "contact_phone": "(408) 555-0606",
            "contact_email": "info@nrityaframes.com",
            "rating": 4.9,
            "review_count": 73,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": "system",
            "business_name": "Bay Area Event Photos",
            "category": "photographer",
            "description": "Professional event photography with quick turnaround. Experienced with Indian cultural events.",
            "location": "San Jose, CA",
            "price_range": "$$",
            "price_estimate": "$1,200 - $2,000",
            "services": ["4-hour coverage", "300+ edited photos", "Digital delivery"],
            "portfolio_images": ["https://images.pexels.com/photos/34717625/pexels-photo-34717625.jpeg"],
            "contact_phone": "(408) 555-0707",
            "contact_email": "book@bayareaphotos.com",
            "rating": 4.5,
            "review_count": 41,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        # Videographers
        {
            "id": str(uuid.uuid4()),
            "user_id": "system",
            "business_name": "Kalai Cinema",
            "category": "videographer",
            "description": "Cinematic Arangetram videos with multiple camera angles. Professional editing with music synchronization.",
            "location": "Milpitas, CA",
            "price_range": "$$$",
            "price_estimate": "$3,500 - $5,500",
            "services": ["Multi-camera setup", "Drone footage", "Highlight reel", "Full ceremony video"],
            "portfolio_images": ["https://images.pexels.com/photos/34717625/pexels-photo-34717625.jpeg"],
            "contact_phone": "(408) 555-0808",
            "contact_email": "films@kalaicinemaa.com",
            "rating": 4.8,
            "review_count": 38,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": "system",
            "business_name": "Simple Stories Video",
            "category": "videographer",
            "description": "Affordable video coverage for dance events. Clean, professional footage with reasonable turnaround.",
            "location": "Santa Clara, CA",
            "price_range": "$$",
            "price_estimate": "$1,500 - $2,500",
            "services": ["Single camera", "Basic editing", "USB delivery", "4-hour coverage"],
            "portfolio_images": ["https://images.pexels.com/photos/34717625/pexels-photo-34717625.jpeg"],
            "contact_phone": "(408) 555-0909",
            "contact_email": "hello@simplestories.com",
            "rating": 4.4,
            "review_count": 25,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        # Decorations
        {
            "id": str(uuid.uuid4()),
            "user_id": "system",
            "business_name": "Pushpanjali Decorators",
            "category": "decorations",
            "description": "Traditional South Indian stage decorations with fresh flowers. Specializing in Arangetram mandapam setups.",
            "location": "Fremont, CA",
            "price_range": "$$$",
            "price_estimate": "$2,000 - $4,500",
            "services": ["Stage backdrop", "Fresh flower arrangements", "Entrance decor", "Table centerpieces"],
            "portfolio_images": ["https://images.pexels.com/photos/16985130/pexels-photo-16985130.jpeg"],
            "contact_phone": "(510) 555-1010",
            "contact_email": "design@pushpanjali.com",
            "rating": 4.7,
            "review_count": 52,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": "system",
            "business_name": "Elegant Events Decor",
            "category": "decorations",
            "description": "Modern fusion decorations blending traditional and contemporary styles. Fabric draping specialists.",
            "location": "San Jose, CA",
            "price_range": "$$",
            "price_estimate": "$1,000 - $2,000",
            "services": ["Fabric draping", "LED backdrop", "Balloon arrangements", "Photo booth setup"],
            "portfolio_images": ["https://images.pexels.com/photos/16985130/pexels-photo-16985130.jpeg"],
            "contact_phone": "(408) 555-1111",
            "contact_email": "info@elegantevents.com",
            "rating": 4.5,
            "review_count": 34,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        # Musicians
        {
            "id": str(uuid.uuid4()),
            "user_id": "system",
            "business_name": "Carnatic Ensemble Bay Area",
            "category": "musicians",
            "description": "Professional Carnatic musicians for Arangetrams. Full orchestra including Nadaswaram, Mridangam, Violin, and Veena.",
            "location": "Sunnyvale, CA",
            "price_range": "$$$",
            "price_estimate": "$3,000 - $5,000",
            "services": ["Full orchestra", "Practice sessions", "Customized compositions", "Sound check included"],
            "portfolio_images": ["https://images.pexels.com/photos/33753145/pexels-photo-33753145.jpeg"],
            "contact_phone": "(408) 555-1212",
            "contact_email": "booking@carnaticensemble.com",
            "rating": 4.9,
            "review_count": 67,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": "system",
            "business_name": "Nada Brahma Musicians",
            "category": "musicians",
            "description": "Experienced accompanists for Bharatanatyam and Kuchipudi. Nattuvangam specialists.",
            "location": "Fremont, CA",
            "price_range": "$$",
            "price_estimate": "$1,500 - $2,500",
            "services": ["Nattuvangam", "Mridangam", "Violin", "Basic orchestra"],
            "portfolio_images": ["https://images.pexels.com/photos/33753145/pexels-photo-33753145.jpeg"],
            "contact_phone": "(510) 555-1313",
            "contact_email": "music@nadabrahma.com",
            "rating": 4.6,
            "review_count": 43,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.vendors.insert_many(vendors_data)
    return {"message": "Database seeded successfully", "vendor_count": len(vendors_data)}

# ===================== ROOT ROUTE =====================

@api_router.get("/")
async def root():
    return {"message": "Arangetram Planning API", "version": "1.0"}

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
