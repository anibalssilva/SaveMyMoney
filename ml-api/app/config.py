from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    MONGODB_URI: str = "mongodb://localhost:27017/savemymoney"
    API_PORT: int = 8000
    NODE_API_URL: str = "http://localhost:5000"
    SECRET_KEY: str = "your-secret-key-change-this"

    # Pydantic v2 settings config
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

settings = Settings()
