from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection
from app.utils.seed_data import seed_database

# Routers
from app.routers import auth, cases, ai, communications, analytics, audit, integrations, notifications, knowledge

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("rxresolve.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing RxResolve API server...")
    await connect_to_mongo()
    await seed_database()
    yield
    logger.info("Shutting down RxResolve API server...")
    await close_mongo_connection()

app = FastAPI(
    title="RxResolve — AI-Powered Prescription Refill Resolution Platform",
    description="Enterprise healthcare operations platform for unblocking and orchestrating prescription refills across pharmacies and physician practices.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enterprise CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global error handler to ensure no internal stack traces leak
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal operational error occurred. The system preserved the case safely."}
    )

# Include Routers
app.include_router(auth.router)
app.include_router(cases.router)
app.include_router(ai.router)
app.include_router(communications.router)
app.include_router(analytics.router)
app.include_router(audit.router)
app.include_router(integrations.router)
app.include_router(notifications.router)
app.include_router(knowledge.router)

@app.get("/")
async def root():
    return {
        "service": "RxResolve Operations Platform",
        "tagline": "Turn stuck refills into resolved care.",
        "status": "OPERATIONAL",
        "docs": "/docs",
        "demo_environment": "Synthetic Healthcare Operations Data (HIPAA-Safe)"
    }
