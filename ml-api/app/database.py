from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

class Database:
    client: AsyncIOMotorClient = None

db = Database()

async def connect_to_mongo():
    """Connect to MongoDB"""
    try:
        print(f"[DB] Connecting to MongoDB...")
        print(f"[DB] URI: {settings.MONGODB_URI[:20]}...{settings.MONGODB_URI[-20:]}")
        db.client = AsyncIOMotorClient(settings.MONGODB_URI)
        # Test connection
        await db.client.admin.command('ping')
        print("[DB] ✅ Connected to MongoDB successfully!")
    except Exception as e:
        print(f"[DB ERROR] ❌ Failed to connect to MongoDB: {type(e).__name__}: {str(e)}")
        raise

async def close_mongo_connection():
    """Close MongoDB connection"""
    db.client.close()
    print("Closed MongoDB connection")

def get_database():
    """Get database instance"""
    if db.client is None:
        print("[DB ERROR] Database client is None! Connection not established.")
        return None
    return db.client.savemymoney
