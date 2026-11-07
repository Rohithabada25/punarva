from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Text, JSON, DateTime, ForeignKey
)
from sqlalchemy.orm import relationship
try:
    from .db import Base
except ImportError:
    from db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(120), nullable=False)
    email = Column(String(180), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=True)
    role = Column(String(20), nullable=False, default="seller")  # seller, buyer, org, admin
    city = Column(String(100), nullable=False, default="Bapatla")
    lat = Column(Float, nullable=False, default=15.9042)
    lng = Column(Float, nullable=False, default=80.4674)
    preferred_language = Column(String(10), nullable=False, default="en")  # en, te, hi
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    listings = relationship("Listing", back_populates="seller", foreign_keys="Listing.seller_id")
    offers = relationship("Offer", back_populates="buyer", foreign_keys="Offer.buyer_id")
    requests = relationship("Request", back_populates="buyer", foreign_keys="Request.buyer_id")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class Listing(Base):
    __tablename__ = "listings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    material = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)  # construction, tiles, wood, furniture, metals, plastics, electronics, other
    quantity = Column(Float, nullable=False, default=1.0)
    unit = Column(String(30), nullable=False, default="pieces")
    weight_kg = Column(Float, nullable=True)
    quantity_source = Column(String(20), nullable=False, default="ai_estimate")  # ai_estimate, manual
    quantity_verified = Column(Boolean, nullable=False, default=False)
    confidence = Column(Float, nullable=False, default=0.85)
    condition = Column(String(20), nullable=False, default="good")  # new, good, fair, poor
    price = Column(Float, nullable=False, default=0.0)
    is_free = Column(Boolean, nullable=False, default=False)
    status = Column(String(30), nullable=False, default="listed")
    # Statuses: draft, listed, offer_received, accepted, pickup_arranged, completed, disputed

    image_url = Column(String(500), nullable=True)
    reuse_recommendation = Column(Text, nullable=True)
    reuse_sources = Column(JSON, nullable=True)  # List of source titles/citations
    hazard_flag = Column(Boolean, nullable=False, default=False)
    hazard_note = Column(Text, nullable=True)

    # Pickup arrangement
    pickup_date = Column(String(50), nullable=True)
    pickup_window = Column(String(80), nullable=True)
    pickup_note = Column(Text, nullable=True)
    pickup_proposed_by = Column(String(20), nullable=True)  # seller, buyer

    # Completion confirmations
    seller_confirmed = Column(Boolean, nullable=False, default=False)
    buyer_confirmed = Column(Boolean, nullable=False, default=False)
    last_confirmation_at = Column(DateTime, nullable=True)

    # Dispute handling
    dispute_reason = Column(String(50), nullable=True)  # wrong_quantity, no_show, not_as_described, other
    dispute_note = Column(Text, nullable=True)
    disputed_at = Column(DateTime, nullable=True)
    admin_note = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)

    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    seller = relationship("User", back_populates="listings", foreign_keys=[seller_id])
    offers = relationship("Offer", back_populates="listing", cascade="all, delete-orphan")
    impact = relationship("Impact", back_populates="listing", uselist=False, cascade="all, delete-orphan")
    events = relationship("ExchangeEvent", back_populates="listing", cascade="all, delete-orphan")


class Request(Base):
    __tablename__ = "requests"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    material = Column(String(100), nullable=False)
    quantity = Column(Float, nullable=False, default=1.0)
    budget = Column(Float, nullable=False, default=0.0)
    lat = Column(Float, nullable=False, default=15.9042)
    lng = Column(Float, nullable=False, default=80.4674)
    is_org = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    buyer = relationship("User", back_populates="requests", foreign_keys=[buyer_id])


class Offer(Base):
    __tablename__ = "offers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    listing_id = Column(Integer, ForeignKey("listings.id"), nullable=False)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    price = Column(Float, nullable=False, default=0.0)
    message = Column(Text, nullable=True)
    status = Column(String(30), nullable=False, default="pending")  # pending, accepted, declined, withdrawn
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    listing = relationship("Listing", back_populates="offers", foreign_keys=[listing_id])
    buyer = relationship("User", back_populates="offers", foreign_keys=[buyer_id])


class Impact(Base):
    __tablename__ = "impact"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    listing_id = Column(Integer, ForeignKey("listings.id"), nullable=False, unique=True)
    kg_diverted = Column(Float, nullable=False, default=0.0)
    co2_saved = Column(Float, nullable=False, default=0.0)
    money_saved = Column(Float, nullable=False, default=0.0)
    is_estimated = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    listing = relationship("Listing", back_populates="impact", foreign_keys=[listing_id])


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String(50), nullable=False)  # offer_received, offer_accepted, match_found, dispute_reported, pickup_arranged, exchange_completed
    message_key = Column(String(100), nullable=False)  # i18n key
    params = Column(JSON, nullable=True)  # Dynamic translation parameters
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="notifications", foreign_keys=[user_id])


class ExchangeEvent(Base):
    __tablename__ = "exchange_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    listing_id = Column(Integer, ForeignKey("listings.id"), nullable=False)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    event = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    listing = relationship("Listing", back_populates="events", foreign_keys=[listing_id])
