from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

class Database:
    client: AsyncIOMotorClient = None

db = Database()

async def connect_to_mongo():
    """Connect to MongoDB"""
    db.client = AsyncIOMotorClient(settings.MONGODB_URI)
    print("Connected to MongoDB")

async def close_mongo_connection():
    """Close MongoDB connection"""
    db.client.close()
    print("Closed MongoDB connection")

def get_database():
    """Get database instance"""
    return db.client.savemymoney
