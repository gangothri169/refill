from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
import logging

logger = logging.getLogger("rxresolve.database")

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_instance = Database()

async def connect_to_mongo():
    try:
        db_instance.client = AsyncIOMotorClient(settings.MONGO_URI, serverSelectionTimeoutMS=5000)
        db_instance.db = db_instance.client[settings.DB_NAME]
        # Test connection
        await db_instance.client.admin.command('ping')
        logger.info(f"Connected to MongoDB at {settings.MONGO_URI} (database: {settings.DB_NAME})")
    except Exception as e:
        logger.warning(f"Could not connect to MongoDB: {e}. Fallback in-memory or retries may be required.")

async def close_mongo_connection():
    if db_instance.client:
        db_instance.client.close()
        logger.info("Closed MongoDB connection.")

def get_database():
    return db_instance.db
