from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, status
from fastapi.responses import Response

from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.storage import ALLOWED_TYPES, MAX_SIZE, read_file_content, upload_file

router = APIRouter(prefix="/upload", tags=["Upload"])


@router.post("")
async def upload_photo(
    request: Request,
    file: UploadFile,
    current_user: User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Type de fichier non autorisé. Acceptés : {', '.join(ALLOWED_TYPES)}",
        )

    data = await file.read()

    if len(data) > MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Fichier trop volumineux (5 Mo maximum)",
        )

    try:
        url = upload_file(data, file.content_type)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Impossible de televerser le fichier. Verifie la configuration du stockage.",
        )

    if url.startswith("/"):
        url = f"{str(request.base_url).rstrip('/')}{url}"

    return {"url": url}


@router.get("/proxy")
async def proxy_photo(source: str):
    try:
        file_bytes, media_type = read_file_content(source)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Source de fichier invalide",
        )
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fichier introuvable",
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Impossible de charger le fichier",
        )

    return Response(
        content=file_bytes,
        media_type=media_type,
        headers={"Cache-Control": "public, max-age=3600"},
    )
