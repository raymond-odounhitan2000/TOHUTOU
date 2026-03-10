import json

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

    # CORS (env: JSON "[\"https://a.com\"]" ou URLs séparées par des virgules; accès liste via .cors_origins_list)
    CORS_ORIGINS: str = "http://localhost:3000"

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
        # Tolère espaces/sauts de ligne et clés trop longues (prend les 64 premiers caractères hex)
        raw = value.strip().lower().replace(" ", "").replace("\n", "").replace("\r", "")
        clean = "".join(c for c in raw if c in "0123456789abcdef")
        if len(clean) < 64:
            raise ValueError("AES_KEY doit contenir au moins 64 caractères hexadécimaux")
        clean = clean[:64]
        try:
            int(clean, 16)
        except ValueError as exc:
            raise ValueError("AES_KEY doit être hexadécimal") from exc
        return clean

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS_ORIGINS (JSON array ou URLs séparées par des virgules) en liste."""
        s = (self.CORS_ORIGINS or "").strip()
        if not s:
            return ["http://localhost:3000"]
        if s.startswith("["):
            try:
                return json.loads(s)
            except json.JSONDecodeError:
                pass
        return [o.strip() for o in s.split(",") if o.strip()]

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
