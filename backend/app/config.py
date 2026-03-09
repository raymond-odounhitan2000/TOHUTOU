from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # AES-256 encryption key (32 bytes hex-encoded = 64 chars)
    AES_KEY: str

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # Super Admin (created on first startup)
    ADMIN_PHONE: str = ""
    ADMIN_PASSWORD: str = ""
    ADMIN_FIRST_NAME: str = "Super"
    ADMIN_LAST_NAME: str = "Admin"

    # S3 Storage (optional, provided later)
    S3_ENDPOINT: str = ""
    S3_BUCKET: str = ""
    S3_ACCESS_KEY: str = ""
    S3_SECRET_KEY: str = ""
    S3_REGION: str = ""

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, value: str) -> str:
        clean = value.strip()
        if len(clean) < 32:
            raise ValueError("SECRET_KEY doit contenir au moins 32 caractères")
        return clean

    @field_validator("AES_KEY")
    @classmethod
    def validate_aes_key(cls, value: str) -> str:
        clean = value.strip().lower()
        if len(clean) != 64:
            raise ValueError("AES_KEY doit contenir exactement 64 caractères hexadécimaux")
        try:
            int(clean, 16)
        except ValueError as exc:
            raise ValueError("AES_KEY doit être hexadécimal") from exc
        return clean

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
