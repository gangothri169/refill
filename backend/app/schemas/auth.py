from typing import Optional
from pydantic import BaseModel

class LoginRequest(BaseModel):
    email: str
    password: Optional[str] = "demo123"

class DemoLoginRequest(BaseModel):
    role: str # "PHARMACY_STAFF", "PRACTICE_STAFF", "PROVIDER", "ADMIN"

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict
