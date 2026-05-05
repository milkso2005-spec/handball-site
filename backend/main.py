import sys
import os

# ── Fix imports pour Vercel (ajouter le dossier backend au path) ───
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    UploadFile,
    File,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import io
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

# ── Charger .env avant tout ────────────────────────────────────────
# Chercher .env dans le dossier backend d'abord, puis à la racine
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    load_dotenv()

# ── Imports internes ───────────────────────────────────────────────
import models
import schemas
from database import engine, Base, get_db
import auth
from auth import (
    get_current_user,
    hash_password,
    create_access_token,
    verify_password,
)

# ── Créer les tables si elles n'existent pas ───────────────────────
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"DB table creation deferred: {e}")

# ── Application FastAPI ────────────────────────────────────────
app = FastAPI(title="Handball Site API")

# ── CORS ───────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Cloudinary configuration ───────────────────────────────────
cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
api_key = os.getenv("CLOUDINARY_API_KEY")
api_secret = os.getenv("CLOUDINARY_API_SECRET")

if api_key:
    cloudinary.config(
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret,
    )

# ══════════════════════════════════════════════════════════════════
#  PUBLIC ROUTES (no auth required)
# ══════════════════════════════════════════════════════════════════

@app.get("/")
def root():
    return {"message": "Handball Site API is running"}

@app.get("/health")
def health():
    return {"status": "ok", "db": bool(engine)}

# ── PLAYERS ───────────────────────────────────────────────────────
@app.get("/players", response_model=List[schemas.PlayerResponse])
def get_players(db: Session = Depends(get_db)):
    return db.query(models.Player).all()

@app.post("/players", response_model=schemas.PlayerResponse)
def create_player(
    player: schemas.PlayerCreate, db: Session = Depends(get_db)
):
    db_player = models.Player(**player.model_dump())
    db.add(db_player)
    db.commit()
    db.refresh(db_player)
    return db_player

# ── MATCHES ───────────────────────────────────────────────────────
@app.get("/matches", response_model=List[schemas.MatchResponse])
def get_matches(db: Session = Depends(get_db)):
    return (
        db.query(models.Match)
        .order_by(models.Match.created_at.desc())
        .all()
    )

@app.post("/matches", response_model=schemas.MatchResponse)
def create_match(
    match: schemas.MatchCreate, db: Session = Depends(get_db)
):
    db_match = models.Match(**match.model_dump())
    db.add(db_match)
    db.commit()
    db.refresh(db_match)
    return db_match

# ── TROPHIES ───────────────────────────────────────────────────────
@app.get("/trophies", response_model=List[schemas.TrophyResponse])
def get_trophies(db: Session = Depends(get_db)):
    return db.query(models.Trophy).all()

@app.post("/trophies", response_model=schemas.TrophyResponse)
def create_trophy(
    trophy: schemas.TrophyCreate, db: Session = Depends(get_db)
):
    db_trophy = models.Trophy(**trophy.model_dump())
    db.add(db_trophy)
    db.commit()
    db.refresh(db_trophy)
    return db_trophy

# ── HOMMAGES ───────────────────────────────────────────────────────
@app.get("/hommages", response_model=List[schemas.HommageResponse])
def get_hommages(db: Session = Depends(get_db)):
    return (
        db.query(models.Hommage)
        .order_by(models.Hommage.created_at.desc())
        .all()
    )

@app.post("/hommages", response_model=schemas.HommageResponse)
def create_hommage(
    hommage: schemas.HommageCreate, db: Session = Depends(get_db)
):
    db_hommage = models.Hommage(**hommage.model_dump())
    db.add(db_hommage)
    db.commit()
    db.refresh(db_hommage)
    return db_hommage

# ══════════════════════════════════════════════════════════════════
#  AUTH ROUTES
# ══════════════════════════════════════════════════════════════════

@app.post("/auth/login", response_model=schemas.Token)
def login(request: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.Admin).filter(models.Admin.email == request.email).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
        )
    token = create_access_token(data={"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/auth/me", response_model=schemas.AdminResponse)
def get_me(current_user: models.Admin = Depends(get_current_user)):
    return current_user

# ══════════════════════════════════════════════════════════════════
#  ADMIN ROUTES (auth required)
# ══════════════════════════════════════════════════════════════════

@app.get("/stats", response_model=schemas.StatsResponse)
def get_stats(db: Session = Depends(get_db)):
    return {
        "players": db.query(models.Player).count(),
        "matches": db.query(models.Match).count(),
        "trophies": db.query(models.Trophy).count(),
        "hommages": db.query(models.Hommage).count(),
        "admins": db.query(models.Admin).count(),
    }

@app.get("/admins", response_model=List[schemas.AdminResponse])
def get_admins(
    db: Session = Depends(get_db),
    current_user: models.Admin = Depends(get_current_user),
):
    return db.query(models.Admin).all()

@app.post("/admins", response_model=schemas.AdminResponse)
def create_admin(
    admin: schemas.AdminCreate,
    db: Session = Depends(get_db),
    current_user: models.Admin = Depends(get_current_user),
):
    if current_user.role != "super-admin":
        raise HTTPException(status_code=403, detail="Acces reserve aux super-admins")
    existing = db.query(models.Admin).filter(models.Admin.email == admin.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Cet email existe deja")
    db_admin = models.Admin(
        name=admin.name,
        email=admin.email,
        role=admin.role,
        hashed_password=hash_password(admin.password),
    )
    db.add(db_admin)
    db.commit()
    db.refresh(db_admin)
    return db_admin

# ── UPLOAD TO CLOUDINARY ────────────────────────────────────────
@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if not os.getenv("CLOUDINARY_API_KEY"):
        return {"url": f"assets/images/uploaded_{file.filename}"}

    try:
        contents = await file.read()
        result = cloudinary.uploader.upload(
            io.BytesIO(contents),
            resource_type="auto",
            folder="handball-site",
        )
        url = result.get("secure_url")
        return {"url": url}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
