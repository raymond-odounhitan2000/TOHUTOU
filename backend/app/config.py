import json

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings
from sqlalchemy import URL


class Settings(BaseSettings):
    DATABASE_URL: str = ""
    DATABASE_HOST: str = ""
    DATABASE_USER: str = ""
    DATABASE_PASSWORD: str = ""
    DATABASE_NAME: str = ""
    DATABASE_PORT: int = 5432

    @model_validator(mode="after")
    def require_database_config(self):
        """Exige soit DATABASE_URL, soit DATABASE_HOST + USER + NAME."""
        url = (self.DATABASE_URL or "").strip()
        has_components = self.DATABASE_HOST and self.DATABASE_USER and self.DATABASE_NAME
        if not url and not has_components:
            raise ValueError(
                "Config DB : définir DATABASE_URL ou (DATABASE_HOST, DATABASE_USER, DATABASE_NAME)"
            )
        return self

    @property
    def database_url(self) -> str:
        """URL de connexion : construite avec URL.create si composants fournis, sinon DATABASE_URL."""
        if self.DATABASE_HOST and self.DATABASE_USER and self.DATABASE_NAME:
            url = URL.create(
                drivername="postgresql+asyncpg",
                username=self.DATABASE_USER,
                password=self.DATABASE_PASSWORD,
                host=self.DATABASE_HOST,
                port=self.DATABASE_PORT,
                database=self.DATABASE_NAME,
            )
            return url.render_as_string(hide_password=False)
        s = (self.DATABASE_URL or "").strip()
        if s and s.startswith("postgresql://") and "+asyncpg" not in s:
            s = s.replace("postgresql://", "postgresql+asyncpg://", 1)
        return s

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
        return [o.strip() for o in s.replace(";", ",").split(",") if o.strip()]

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
