from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    MONGODB_URI: str = "mongodb://localhost:27017/savemymoney"
    API_PORT: int = 8000
    NODE_API_URL: str = "http://localhost:5000"
    SECRET_KEY: str = "your-secret-key-change-this"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
