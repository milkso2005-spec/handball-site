from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from datetime import timedelta
import os
from dotenv import load_dotenv

# Load .env BEFORE anything else
load_dotenv()

import cloudinary
import cloudinary.uploader

import models
import schemas
from database import engine, Base, get_db

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)

app = FastAPI(title="Handball Site API")
api_router = APIRouter()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cloudinary Setup
cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME')
api_key = os.getenv('CLOUDINARY_API_KEY')
api_secret = os.getenv('CLOUDINARY_API_SECRET')
print(f"☁️ Cloudinary config: cloud={cloud_name}, key={'***' + api_key[-4:] if api_key else 'MISSING'}")

cloudinary.config(
  cloud_name = cloud_name,
  api_key = api_key,
  api_secret = api_secret
)

@api_router.get("/")
def root():
    return {"message": "Handball Site API is running"}

# --- PLAYERS ---
@api_router.get("/players", response_model=List[schemas.PlayerResponse])
def get_players(db: Session = Depends(get_db)):
    return db.query(models.Player).all()

@api_router.post("/players", response_model=schemas.PlayerResponse)
def create_player(player: schemas.PlayerCreate, db: Session = Depends(get_db)):
    db_player = models.Player(**player.model_dump())
    db.add(db_player)
    db.commit()
    db.refresh(db_player)
    return db_player

# --- MATCHES ---
@api_router.get("/matches", response_model=List[schemas.MatchResponse])
def get_matches(db: Session = Depends(get_db)):
    return db.query(models.Match).order_by(models.Match.created_at.desc()).all()

@api_router.post("/matches", response_model=schemas.MatchResponse)
def create_match(match: schemas.MatchCreate, db: Session = Depends(get_db)):
    db_match = models.Match(**match.model_dump())
    db.add(db_match)
    db.commit()
    db.refresh(db_match)
    return db_match

# --- TROPHIES ---
@api_router.get("/trophies", response_model=List[schemas.TrophyResponse])
def get_trophies(db: Session = Depends(get_db)):
    return db.query(models.Trophy).all()

@api_router.post("/trophies", response_model=schemas.TrophyResponse)
def create_trophy(trophy: schemas.TrophyCreate, db: Session = Depends(get_db)):
    db_trophy = models.Trophy(**trophy.model_dump())
    db.add(db_trophy)
    db.commit()
    db.refresh(db_trophy)
    return db_trophy

# --- HOMMAGES ---
@api_router.get("/hommages", response_model=List[schemas.HommageResponse])
def get_hommages(db: Session = Depends(get_db)):
    return db.query(models.Hommage).order_by(models.Hommage.created_at.desc()).all()

@api_router.post("/hommages", response_model=schemas.HommageResponse)
def create_hommage(hommage: schemas.HommageCreate, db: Session = Depends(get_db)):
    db_hommage = models.Hommage(**hommage.model_dump())
    db.add(db_hommage)
    db.commit()
    db.refresh(db_hommage)
    return db_hommage

import auth
from auth import get_current_user, hash_password, create_access_token, verify_password

# --- AUTH ---
@api_router.post("/auth/login", response_model=schemas.Token)
def login(request: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.Admin).filter(models.Admin.email == request.email).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiants incorrects"
        )
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.get("/auth/me", response_model=schemas.AdminResponse)
def get_me(current_user: models.Admin = Depends(get_current_user)):
    return current_user

# --- ADMINS ---
@api_router.get("/admins", response_model=List[schemas.AdminResponse])
def get_admins(db: Session = Depends(get_db), current_user: models.Admin = Depends(get_current_user)):
    return db.query(models.Admin).all()

@api_router.post("/admins", response_model=schemas.AdminResponse)
def create_admin(admin: schemas.AdminCreate, db: Session = Depends(get_db), current_user: models.Admin = Depends(auth.require_super_admin)):
    db_admin = models.Admin(
        name=admin.name,
        email=admin.email,
        role=admin.role,
        hashed_password=hash_password(admin.password)
    )
    db.add(db_admin)
    db.commit()
    db.refresh(db_admin)
    return db_admin

# --- STATS ---
@api_router.get("/stats", response_model=schemas.StatsResponse)
def get_stats(db: Session = Depends(get_db)):
    return {
        "players": db.query(models.Player).count(),
        "matches": db.query(models.Match).count(),
        "trophies": db.query(models.Trophy).count(),
        "hommages": db.query(models.Hommage).count(),
        "admins": db.query(models.Admin).count()
    }

# --- UPLOAD TO CLOUDINARY ---
@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...), current_user: models.Admin = Depends(get_current_user)):
    print(f"📤 Upload request by {current_user.email}: {file.filename}")
    
    if not os.getenv('CLOUDINARY_API_KEY'):
        print("⚠️ Cloudinary not configured, returning fake URL")
        return {"url": f"assets/images/uploaded_{file.filename}"}
        
    try:
        contents = await file.read()
        import io
        result = cloudinary.uploader.upload(
            io.BytesIO(contents),
            resource_type="auto",
            folder="handball-site"
        )
        url = result.get("secure_url")
        return {"url": url}
    except Exception as e:
        print(f"❌ Upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

app.include_router(api_router, prefix="/api")
