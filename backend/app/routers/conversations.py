from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.user import User
from app.schemas.conversation import (
    ConversationCreate,
    ConversationResponse,
    MessageCreate,
    MessageResponse,
    UserBrief,
)
from app.services.notifications import create_notification, NotificationType

router = APIRouter(prefix="/conversations", tags=["Chat"])


# ── helpers ──────────────────────────────────────────────────────────────


def _other_participant_id(conv: Conversation, user_id: int) -> int:
    """Return the id of the *other* participant."""
    return (
        conv.participant_2_id
        if conv.participant_1_id == user_id
        else conv.participant_1_id
    )


async def _get_conversation_or_404(
    conversation_id: int,
    current_user: User,
    db: AsyncSession,
) -> Conversation:
    result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation introuvable",
        )
    if current_user.id not in (conv.participant_1_id, conv.participant_2_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous ne participez pas à cette conversation",
        )
    return conv


async def _build_response(
    conv: Conversation,
    current_user_id: int,
    db: AsyncSession,
) -> ConversationResponse:
    other_id = _other_participant_id(conv, current_user_id)

    # Fetch other participant
    result = await db.execute(select(User).where(User.id == other_id))
    other_user = result.scalar_one()

    # Last message preview
    last_msg_result = await db.execute(
        select(Message.content)
        .where(Message.conversation_id == conv.id)
        .order_by(Message.created_at.desc())
        .limit(1)
    )
    last_msg_content = last_msg_result.scalar_one_or_none()

    # Unread count (messages *from the other user* that are unread)
    unread_result = await db.execute(
        select(func.count())
        .select_from(Message)
        .where(
            Message.conversation_id == conv.id,
            Message.sender_id != current_user_id,
            Message.is_read == False,  # noqa: E712
        )
    )
    unread = unread_result.scalar() or 0

    return ConversationResponse(
        id=conv.id,
        participant_1_id=conv.participant_1_id,
        participant_2_id=conv.participant_2_id,
        announcement_id=conv.announcement_id,
        last_message_at=conv.last_message_at,
        created_at=conv.created_at,
        other_participant=UserBrief(
            id=other_user.id,
            first_name=other_user.first_name,
            last_name=other_user.last_name,
            role=other_user.role.value if hasattr(other_user.role, "value") else str(other_user.role),
        ),
        last_message_preview=last_msg_content[:120] if last_msg_content else None,
        unread_count=unread,
    )


# ── endpoints ────────────────────────────────────────────────────────────


@router.get("", response_model=list[ConversationResponse])
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return all conversations the current user participates in, ordered by
    last activity (most recent first)."""
    result = await db.execute(
        select(Conversation)
        .where(
            or_(
                Conversation.participant_1_id == current_user.id,
                Conversation.participant_2_id == current_user.id,
            )
        )
        .order_by(Conversation.last_message_at.desc().nulls_last())
    )
    conversations = result.scalars().all()

    responses: list[ConversationResponse] = []
    for conv in conversations:
        responses.append(await _build_response(conv, current_user.id, db))
    return responses


@router.post("", response_model=ConversationResponse, status_code=201)
async def create_conversation(
    data: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new conversation (or reuse an existing one) and send the
    initial message."""
    if data.participant_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vous ne pouvez pas démarrer une conversation avec vous-même",
        )

    # Verify target participant exists
    target_result = await db.execute(
        select(User).where(User.id == data.participant_id)
    )
    target_user = target_result.scalar_one_or_none()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur cible introuvable",
        )

    # Look for an existing conversation between the two users, optionally
    # scoped to a specific announcement.
    existing_query = select(Conversation).where(
        or_(
            and_(
                Conversation.participant_1_id == current_user.id,
                Conversation.participant_2_id == data.participant_id,
            ),
            and_(
                Conversation.participant_1_id == data.participant_id,
                Conversation.participant_2_id == current_user.id,
            ),
        )
    )
    if data.announcement_id is not None:
        existing_query = existing_query.where(
            Conversation.announcement_id == data.announcement_id
        )
    else:
        existing_query = existing_query.where(
            Conversation.announcement_id.is_(None)
        )

    result = await db.execute(existing_query)
    conversation = result.scalar_one_or_none()

    now = datetime.now(timezone.utc)

    if not conversation:
        conversation = Conversation(
            participant_1_id=current_user.id,
            participant_2_id=data.participant_id,
            announcement_id=data.announcement_id,
            last_message_at=now,
        )
        db.add(conversation)
        await db.flush()

    # Create the initial message
    message = Message(
        conversation_id=conversation.id,
        sender_id=current_user.id,
        content=data.initial_message,
    )
    db.add(message)
    conversation.last_message_at = now
    await db.commit()
    await db.refresh(conversation)

    # Notification for the other participant
    other_id = _other_participant_id(conversation, current_user.id)
    try:
        await create_notification(
            db=db,
            user_id=other_id,
            type=NotificationType.NEW_MESSAGE,
            title="Nouveau message",
            message=f"{current_user.first_name} {current_user.last_name} vous a envoyé un message",
            reference_id=conversation.id,
            reference_type="conversation",
        )
    except Exception:
        pass  # Don't fail the request if notification fails

    return await _build_response(conversation, current_user.id, db)


@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return the total number of unread messages across all conversations."""
    result = await db.execute(
        select(func.count())
        .select_from(Message)
        .join(Conversation, Message.conversation_id == Conversation.id)
        .where(
            or_(
                Conversation.participant_1_id == current_user.id,
                Conversation.participant_2_id == current_user.id,
            ),
            Message.sender_id != current_user.id,
            Message.is_read == False,  # noqa: E712
        )
    )
    count = result.scalar() or 0
    return {"unread_count": count}


@router.get("/{conversation_id}/messages", response_model=list[MessageResponse])
async def list_messages(
    conversation_id: int,
    page: int = 1,
    size: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return paginated messages for a conversation (newest first)."""
    await _get_conversation_or_404(conversation_id, current_user, db)

    offset = (page - 1) * size
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.desc())
        .offset(offset)
        .limit(size)
    )
    return result.scalars().all()


@router.post(
    "/{conversation_id}/messages",
    response_model=MessageResponse,
    status_code=201,
)
async def send_message(
    conversation_id: int,
    data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a new message in an existing conversation."""
    conv = await _get_conversation_or_404(conversation_id, current_user, db)

    now = datetime.now(timezone.utc)
    message = Message(
        conversation_id=conv.id,
        sender_id=current_user.id,
        content=data.content,
    )
    db.add(message)
    conv.last_message_at = now
    await db.commit()
    await db.refresh(message)

    # Notification for the other participant
    other_id = _other_participant_id(conv, current_user.id)
    try:
        await create_notification(
            db=db,
            user_id=other_id,
            type=NotificationType.NEW_MESSAGE,
            title="Nouveau message",
            message=f"{current_user.first_name} {current_user.last_name} vous a envoyé un message",
            reference_id=conv.id,
            reference_type="conversation",
        )
    except Exception:
        pass  # Don't fail the request if notification fails

    return message


@router.put("/{conversation_id}/read", status_code=200)
async def mark_as_read(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark all unread messages *from the other user* as read."""
    await _get_conversation_or_404(conversation_id, current_user, db)

    await db.execute(
        update(Message)
        .where(
            Message.conversation_id == conversation_id,
            Message.sender_id != current_user.id,
            Message.is_read == False,  # noqa: E712
        )
        .values(is_read=True)
    )
    await db.commit()
    return {"detail": "Messages marqués comme lus"}
