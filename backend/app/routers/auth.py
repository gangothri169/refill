from fastapi import APIRouter, HTTPException, Depends, Header
from datetime import datetime, timedelta
from jose import jwt, JWTError
from app.config import settings
from app.database import get_database
from app.schemas.auth import LoginRequest, DemoLoginRequest, TokenResponse
from app.utils.seed_data import DEMO_USERS
import logging

logger = logging.getLogger("rxresolve.auth")
router = APIRouter(prefix="/api/auth", tags=["Authentication"])

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

async def get_current_user(authorization: str = Header(None)):
    if not authorization:
        # For seamless demo experience, fallback to default practice staff if not authenticated
        return DEMO_USERS[1]
    try:
        token = authorization.replace("Bearer ", "").strip()
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            return DEMO_USERS[1]
        db = get_database()
        if db is not None:
            user = await db.users.find_one({"id": user_id}, {"_id": 0})
            if user:
                return user
        # Fallback to in-memory demo user match
        for u in DEMO_USERS:
            if u["id"] == user_id:
                return u
        return DEMO_USERS[1]
    except JWTError:
        return DEMO_USERS[1]

@router.get("/demo-users")
async def get_demo_users():
    """Returns the four primary demo user profiles for the login screen selector."""
    return DEMO_USERS

@router.post("/demo-login", response_model=TokenResponse)
async def demo_login(req: DemoLoginRequest):
    """Convenient one-click login for demoing the four user roles."""
    user = next((u for u in DEMO_USERS if u["role"] == req.role), None)
    if not user:
        raise HTTPException(status_code=400, detail=f"Invalid demo role '{req.role}'")

    token = create_access_token({"sub": user["id"], "role": user["role"], "org": user["organization_id"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest):
    """Standard healthcare email login."""
    db = get_database()
    user = None
    if db is not None:
        user = await db.users.find_one({"email": req.email.lower().strip()}, {"_id": 0})
    if not user:
        user = next((u for u in DEMO_USERS if u["email"].lower() == req.email.lower().strip()), None)
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid healthcare provider or staff credentials")

    token = create_access_token({"sub": user["id"], "role": user["role"], "org": user["organization_id"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user
