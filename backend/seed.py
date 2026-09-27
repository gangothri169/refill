import asyncio
from app.database import connect_to_mongo, close_mongo_connection
from app.utils.seed_data import seed_database

async def main():
    await connect_to_mongo()
    await seed_database()
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(main())
