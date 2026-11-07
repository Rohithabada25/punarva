from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field

# User Schemas
class UserBase(BaseModel):
    name: str
    email: str
    role: str = "seller"
    city: str = "Bapatla"
    lat: float = 15.9042
    lng: float = 80.4674
    preferred_language: str = "en"

class UserCreate(UserBase):
    pass

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    email: str = Field(..., min_length=5, max_length=180)
    password: str = Field(..., min_length=6, max_length=128)
    role: str = Field("seller", pattern="^(seller|buyer|org|admin)$")
    city: str = Field("Bapatla", max_length=100)
    lat: Optional[float] = 15.9042
    lng: Optional[float] = 80.4674
    preferred_language: str = Field("en", pattern="^(en|te|hi)$")

class UserLogin(BaseModel):
    email: str
    password: str

class PersonaSwitchRequest(BaseModel):
    user_id: int

class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=120)
    city: Optional[str] = Field(None, max_length=100)
    role: Optional[str] = Field(None, pattern="^(seller|buyer|org|admin)$")
    preferred_language: Optional[str] = Field(None, pattern="^(en|te|hi)$")
    lat: Optional[float] = None
    lng: Optional[float] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = Field(None, min_length=6, max_length=128)

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class AuthResponse(BaseModel):
    user: UserResponse
    token: str

class UserLanguageUpdate(BaseModel):
    preferred_language: str

# Agent Trace Schema
class AgentTraceItem(BaseModel):
    agent: str
    status: str  # success, mocked, failed
    summary: str
    duration_ms: int

# Listing Schemas
class ListingCreate(BaseModel):
    seller_id: int
    title: str
    material: str
    category: str
    quantity: float
    unit: str = "pieces"
    weight_kg: Optional[float] = None
    quantity_source: str = "manual"  # ai_estimate, manual
    quantity_verified: bool = True
    confidence: float = 1.0
    condition: str = "good"  # new, good, fair, poor
    price: float = 0.0
    is_free: bool = False
    image_url: Optional[str] = None
    reuse_recommendation: Optional[str] = None
    reuse_sources: Optional[List[str]] = None
    hazard_flag: bool = False
    hazard_note: Optional[str] = None

class ListingPickupRequest(BaseModel):
    pickup_date: str
    pickup_window: str
    pickup_note: Optional[str] = None
    actor_role: Optional[str] = None  # seller | buyer
    actor_id: Optional[int] = None

class ListingPickupAcceptRequest(BaseModel):
    actor_role: Optional[str] = None  # seller | buyer
    actor_id: Optional[int] = None

class ListingConfirmRequest(BaseModel):
    role: Optional[str] = None  # seller | buyer
    actor_id: Optional[int] = None
    confirmed: Optional[bool] = True

class ListingDisputeRequest(BaseModel):
    role: str  # seller | buyer
    reason: str  # wrong_quantity | no_show | not_as_described | other
    note: str

class ListingDisputeResolveRequest(BaseModel):
    action: str  # complete | cancel | reject
    admin_note: Optional[str] = None

class OfferBase(BaseModel):
    listing_id: int
    buyer_id: int
    price: float
    message: Optional[str] = None

class OfferCreate(OfferBase):
    pass

class OfferResponse(OfferBase):
    id: int
    status: str
    created_at: datetime
    buyer_name: Optional[str] = None
    buyer_city: Optional[str] = None
    is_best_offer: Optional[bool] = False
    negotiation_reason: Optional[str] = None

    class Config:
        from_attributes = True

class ImpactResponse(BaseModel):
    id: int
    listing_id: int
    kg_diverted: float
    co2_saved: float
    money_saved: float
    is_estimated: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ListingResponse(BaseModel):
    id: int
    seller_id: int
    title: str
    material: str
    category: str
    quantity: float
    unit: str
    weight_kg: Optional[float] = None
    quantity_source: str
    quantity_verified: bool
    confidence: float
    condition: str
    price: float
    is_free: bool
    status: str
    image_url: Optional[str] = None
    reuse_recommendation: Optional[str] = None
    reuse_sources: Optional[List[str]] = None
    hazard_flag: bool
    hazard_note: Optional[str] = None
    pickup_date: Optional[str] = None
    pickup_window: Optional[str] = None
    pickup_note: Optional[str] = None
    pickup_proposed_by: Optional[str] = None
    seller_confirmed: bool
    buyer_confirmed: bool
    last_confirmation_at: Optional[datetime] = None
    dispute_reason: Optional[str] = None
    dispute_note: Optional[str] = None
    disputed_at: Optional[datetime] = None
    admin_note: Optional[str] = None
    resolved_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime

    # Additional computed view fields
    seller_name: Optional[str] = None
    seller_city: Optional[str] = None
    distance_km: Optional[float] = None
    seller_rating: Optional[float] = 4.8
    match_reason: Optional[str] = None
    impact: Optional[ImpactResponse] = None

    class Config:
        from_attributes = True

# Wanted Request Schemas
class RequestCreate(BaseModel):
    buyer_id: int
    material: str
    quantity: float
    budget: float
    lat: Optional[float] = None
    lng: Optional[float] = None
    is_org: bool = False

class RequestResponse(BaseModel):
    id: int
    buyer_id: int
    buyer_name: Optional[str] = None
    material: str
    quantity: float
    budget: float
    lat: float
    lng: float
    is_org: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Notification Schemas
class NotificationResponse(BaseModel):
    id: int
    user_id: int
    type: str
    message_key: str
    params: Optional[Dict[str, Any]] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Match Response Schemas
class MatchedBuyer(BaseModel):
    buyer_id: int
    buyer_name: str
    is_org: bool
    city: str
    distance_km: float
    requested_qty: float
    budget: float
    match_score: float
    match_reason: str

class FallbackOption(BaseModel):
    type: str  # recycler | donation | diy
    name: str
    description: str
    location: Optional[str] = None
    contact: Optional[str] = None
    guide_title: Optional[str] = None

class MatchesResult(BaseModel):
    listing_id: int
    has_matches: bool
    matches: List[MatchedBuyer] = []
    fallbacks: List[FallbackOption] = []

# Analysis Result Schema
class AnalysisResult(BaseModel):
    material_type: str
    category: str
    estimated_quantity: float
    unit: str
    condition: str
    hazard_flag: bool
    hazard_note: Optional[str] = None
    confidence: float
    suggested_price: float
    price_range: Dict[str, float]
    price_explanation: str
    reuse_recommendation: str
    reuse_sources: List[str]
    is_mocked: bool = False
    agent_trace: List[AgentTraceItem]
