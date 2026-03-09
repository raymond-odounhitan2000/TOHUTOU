import uuid
from io import BytesIO
from mimetypes import guess_type
from pathlib import Path
from urllib.parse import urlparse

import boto3
from botocore.config import Config as BotoConfig

from app.config import settings

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE = 5 * 1024 * 1024  # 5 MB
SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7  # 7 jours
LOCAL_UPLOAD_ROOT = Path(__file__).resolve().parents[2] / "uploads"
ALLOWED_MEDIA_PREFIXES = ("announcements/", "organizations/", "logos/", "users/")
ALLOWED_MEDIA_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


def _get_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.S3_ENDPOINT or None,
        aws_access_key_id=settings.S3_ACCESS_KEY,
        aws_secret_access_key=settings.S3_SECRET_KEY,
        region_name=settings.S3_REGION or "us-east-1",
        config=BotoConfig(signature_version="s3v4"),
    )


def _upload_file_local(data: bytes, key: str) -> str:
    path = LOCAL_UPLOAD_ROOT / key
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return f"/uploads/{key}"


def _build_s3_base_url(key: str) -> str:
    if settings.S3_ENDPOINT:
        return f"{settings.S3_ENDPOINT.rstrip('/')}/{settings.S3_BUCKET}/{key}"
    region = settings.S3_REGION or "us-east-1"
    return f"https://{settings.S3_BUCKET}.s3.{region}.amazonaws.com/{key}"


def _is_local_upload_url(url: str) -> bool:
    clean_url = url.split("?", 1)[0].strip()
    if clean_url.startswith("/uploads/"):
        return True

    parsed = urlparse(clean_url)
    return parsed.path.startswith("/uploads/")


def _normalize_storage_key(raw_key: str | None) -> str | None:
    if not raw_key:
        return None

    key = raw_key.strip().lstrip("/")
    if not key:
        return None

    if key.startswith("uploads/"):
        key = key[len("uploads/") :]

    if settings.S3_BUCKET and key.startswith(f"{settings.S3_BUCKET}/"):
        key = key[len(settings.S3_BUCKET) + 1 :]

    if (
        ".." in key
        or key.startswith(".")
        or key.startswith("/")
        or "\\" in key
    ):
        return None

    if any(key.startswith(prefix) for prefix in ALLOWED_MEDIA_PREFIXES):
        return key

    suffix = Path(key).suffix.lower()
    if "/" not in key and suffix in ALLOWED_MEDIA_EXTENSIONS:
        return key

    return None


def _extract_storage_key(url: str) -> str | None:
    if not url:
        return None

    clean_url = url.split("?", 1)[0].strip()
    if not clean_url:
        return None

    if clean_url.startswith("/uploads/"):
        return _normalize_storage_key(clean_url[len("/uploads/") :])

    if settings.S3_ENDPOINT and settings.S3_BUCKET:
        prefix = f"{settings.S3_ENDPOINT.rstrip('/')}/{settings.S3_BUCKET}/"
        if clean_url.startswith(prefix):
            return _normalize_storage_key(clean_url[len(prefix) :])

    if settings.S3_BUCKET:
        region = settings.S3_REGION or "us-east-1"
        aws_prefix = f"https://{settings.S3_BUCKET}.s3.{region}.amazonaws.com/"
        if clean_url.startswith(aws_prefix):
            return _normalize_storage_key(clean_url[len(aws_prefix) :])

    parsed = urlparse(clean_url)

    if parsed.scheme in {"http", "https"}:
        path = parsed.path.lstrip("/")
        if settings.S3_BUCKET and path.startswith(f"{settings.S3_BUCKET}/"):
            path = path[len(settings.S3_BUCKET) + 1 :]
        return _normalize_storage_key(path)

    if parsed.scheme == "s3":
        path = parsed.path.lstrip("/")
        if path:
            return _normalize_storage_key(path)

    raw_path = clean_url.lstrip("/")
    if settings.S3_BUCKET and raw_path.startswith(f"{settings.S3_BUCKET}/"):
        raw_path = raw_path[len(settings.S3_BUCKET) + 1 :]
    return _normalize_storage_key(raw_path)


def upload_file(data: bytes, content_type: str, folder: str = "announcements") -> str:
    """Upload bytes to S3 (or local storage fallback) and return a file URL."""
    ext = content_type.split("/")[-1]
    if ext == "jpeg":
        ext = "jpg"
    key = f"{folder}/{uuid.uuid4().hex}.{ext}"

    if not settings.S3_BUCKET:
        return _upload_file_local(data, key)

    client = _get_client()
    client.upload_fileobj(
        BytesIO(data),
        settings.S3_BUCKET,
        key,
        ExtraArgs={"ContentType": content_type},
    )

    return _build_s3_base_url(key)


def delete_file(url: str) -> None:
    """Delete a file from S3 (or local storage) given its URL."""
    key = _extract_storage_key(url)
    if not key:
        return

    if _is_local_upload_url(url):
        local_file = LOCAL_UPLOAD_ROOT / key
        if local_file.exists():
            local_file.unlink()
        return

    if not settings.S3_BUCKET:
        return

    client = _get_client()
    client.delete_object(Bucket=settings.S3_BUCKET, Key=key)


def resolve_public_url(url: str | None) -> str | None:
    """Resolve a persisted storage URL to a browser-accessible URL.

    - Local files keep their `/uploads/...` URL.
    - S3 files are returned as signed URLs so private buckets are viewable.
    """
    if not url:
        return None

    if url.startswith("/uploads/"):
        return url

    if not settings.S3_BUCKET:
        return url

    key = _extract_storage_key(url)
    if not key:
        return url

    try:
        client = _get_client()
        return client.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.S3_BUCKET, "Key": key},
            ExpiresIn=SIGNED_URL_TTL_SECONDS,
        )
    except Exception:
        return url


def read_file_content(url: str) -> tuple[bytes, str]:
    """Read a storage object and return its bytes + content-type."""
    key = _extract_storage_key(url)
    if not key:
        raise ValueError("URL de fichier invalide")

    if _is_local_upload_url(url):
        local_file = LOCAL_UPLOAD_ROOT / key
        if not local_file.exists():
            raise FileNotFoundError("Fichier local introuvable")
        media_type = guess_type(local_file.name)[0] or "application/octet-stream"
        return local_file.read_bytes(), media_type

    if not settings.S3_BUCKET:
        raise FileNotFoundError("Stockage S3 non configuré")

    client = _get_client()
    response = client.get_object(Bucket=settings.S3_BUCKET, Key=key)
    body = response["Body"].read()
    media_type = response.get("ContentType") or guess_type(key)[0] or "application/octet-stream"
    return body, media_type
