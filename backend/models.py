from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from database import Base

class Admin(Base):
    __tablename__ = "admins"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    role = Column(String(50), default="admin") # "admin" or "super-admin"
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Player(Base):
    __tablename__ = "players"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    poste = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False) # e.g. "ancien", "actif", "nouveau"
    bio = Column(Text, nullable=True) # Optional bio
    photo_url = Column(String(255), nullable=True) # Image URL from Cloudinary
    stats_buts = Column(Integer, default=0)
    stats_matches = Column(Integer, default=0)
    stats_passes = Column(Integer, default=0)
    years = Column(String(50), nullable=True)
    created_by = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Match(Base):
    __tablename__ = "matches"
    
    id = Column(Integer, primary_key=True, index=True)
    home_team = Column(String(100), nullable=False)
    away_team = Column(String(100), nullable=False)
    home_score = Column(Integer, nullable=False)
    away_score = Column(Integer, nullable=False)
    status = Column(String(50), nullable=False) # e.g. "terminé", "à venir"
    competition = Column(String(100), default="Championnat National")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Trophy(Base):
    __tablename__ = "trophies"
    
    id = Column(Integer, primary_key=True, index=True)
    year = Column(String(10), nullable=False)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Hommage(Base):
    __tablename__ = "hommages"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    subtitle = Column(String(150), nullable=True)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
