from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection
from app.routers import predictions

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()
    yield
    # Shutdown
    await close_mongo_connection()

app = FastAPI(
    title="SaveMyMoney ML API",
    description="API de Machine Learning para previsão de gastos",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration - Allow all origins for simplicity
# In production, replace ["*"] with specific URLs
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=False,  # Must be False when allow_origins is ["*"]
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers
app.include_router(predictions.router, prefix="/api/predictions", tags=["predictions"])

@app.get("/")
async def root():
    return {
        "message": "SaveMyMoney ML API",
        "version": "1.0.0",
        "status": "active"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ml-api"
    }

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.API_PORT,
        reload=True
    )
