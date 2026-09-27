import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27018")
    DB_NAME: str = os.getenv("DB_NAME", "rxresolve")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "rxresolve_super_secret_enterprise_jwt_key_2026")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", os.getenv("GOOGLE_API_KEY", ""))
    ENVIRONMENT: str = "development"
    PORT: int = 8005
    DEMO_MODE: bool = True

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
