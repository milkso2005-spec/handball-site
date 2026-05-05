from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# --- Token ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# --- Login ---
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# --- Admin ---
class AdminBase(BaseModel):
    name: str
    email: EmailStr
    role: str = "admin"

class AdminCreate(AdminBase):
    password: str

class AdminResponse(AdminBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- Player ---
class PlayerBase(BaseModel):
    name: str
    poste: str
    category: str
    bio: Optional[str] = None
    photo_url: Optional[str] = "assets/images/player-action.png"
    stats_buts: Optional[int] = 0
    stats_matches: Optional[int] = 0
    stats_passes: Optional[int] = 0
    years: Optional[str] = None

class PlayerCreate(PlayerBase):
    pass

class PlayerResponse(PlayerBase):
    id: int
    created_by: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- Match ---
class MatchBase(BaseModel):
    home_team: str
    away_team: str
    home_score: int
    away_score: int
    status: str
    competition: Optional[str] = "Championnat National"

class MatchCreate(MatchBase):
    pass

class MatchResponse(MatchBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- Trophy ---
class TrophyBase(BaseModel):
    year: str
    name: str
    description: Optional[str] = None

class TrophyCreate(TrophyBase):
    pass

class TrophyResponse(TrophyBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- Hommage ---
class HommageBase(BaseModel):
    name: str
    subtitle: Optional[str] = None
    message: str

class HommageCreate(HommageBase):
    pass

class HommageResponse(HommageBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True
# --- Stats ---
class StatsResponse(BaseModel):
    players: int
    matches: int
    trophies: int
    hommages: int
    admins: int
