from fastapi import APIRouter, Depends, HTTPException
from typing import List
from models.client_folder import (
    ClientFolderCreate, ClientFolderUpdate,
    ClientFolderResponse, SubEventSummary
)
from routes.auth import get_current_user
from database import db

router = APIRouter()


def _build_folder_response(folder, events=None) -> ClientFolderResponse:
    """Helper to build a consistent ClientFolderResponse."""
    event_list = events or (folder.events if hasattr(folder, "events") and folder.events else [])
    total_photos = sum(len(e.photos) if hasattr(e, "photos") and e.photos else 0 for e in event_list)

    sub_events = [
        SubEventSummary(
            id=e.id,
            name=e.name,
            description=e.description,
            eventDate=e.eventDate,
            status=e.status,
            coverUrl=e.coverUrl or (e.photos[0].url if hasattr(e, "photos") and e.photos else None),
            photoCount=len(e.photos) if hasattr(e, "photos") and e.photos else 0,
            createdAt=e.createdAt,
        )
        for e in event_list
    ]

    return ClientFolderResponse(
        id=folder.id,
        name=folder.name,
        description=folder.description,
        coverUrl=folder.coverUrl or (event_list[0].photos[0].url if event_list and hasattr(event_list[0], "photos") and event_list[0].photos else None),
        price=folder.price or 0,
        isPaid=folder.isPaid or False,
        whatsappNo=folder.whatsappNo,
        createdAt=folder.createdAt,
        userId=folder.userId,
        eventCount=len(event_list),
        totalPhotos=total_photos,
        events=sub_events,
    )


# ── List all folders for the logged-in photographer ─────────────────────────
@router.get("/", response_model=List[ClientFolderResponse])
async def list_folders(current_user=Depends(get_current_user)):
    folders = await db.clientfolder.find_many(
        where={"userId": current_user.id},
        include={"events": {"include": {"photos": True}}},
        order={"createdAt": "desc"},
    )
    return [_build_folder_response(f) for f in folders]


# ── Create a new folder ──────────────────────────────────────────────────────
@router.post("/", response_model=ClientFolderResponse)
async def create_folder(folder_in: ClientFolderCreate, current_user=Depends(get_current_user)):
    folder = await db.clientfolder.create(
        data={
            "name": folder_in.name,
            "description": folder_in.description,
            "price": folder_in.price or 0,
            "isPaid": folder_in.isPaid or False,
            "whatsappNo": folder_in.whatsappNo,
            "userId": current_user.id,
        },
        include={"events": {"include": {"photos": True}}},
    )
    return _build_folder_response(folder)


# ── Get a single folder with all its sub-events ─────────────────────────────
@router.get("/{folder_id}", response_model=ClientFolderResponse)
async def get_folder(folder_id: str, current_user=Depends(get_current_user)):
    folder = await db.clientfolder.find_unique(
        where={"id": folder_id},
        include={"events": {"include": {"photos": True}}},
    )
    if not folder or folder.userId != current_user.id:
        raise HTTPException(status_code=404, detail="Client folder not found")
    return _build_folder_response(folder)


@router.get("/{folder_id}/public", response_model=ClientFolderResponse)
async def get_folder_public(folder_id: str):
    folder = await db.clientfolder.find_unique(
        where={"id": folder_id},
        include={"events": {"include": {"photos": True}}},
    )
    if not folder:
        raise HTTPException(status_code=404, detail="Client folder not found")
    
    res = _build_folder_response(folder)
    # Hide WhatsApp for public view if needed, but let's keep it for guest contact if desired.
    # The previous implementation explicitly hid it.
    res.whatsappNo = None 
    return res


# ── Update a folder ──────────────────────────────────────────────────────────
@router.put("/{folder_id}", response_model=ClientFolderResponse)
async def update_folder(folder_id: str, folder_in: ClientFolderUpdate, current_user=Depends(get_current_user)):
    folder = await db.clientfolder.find_unique(where={"id": folder_id})
    if not folder or folder.userId != current_user.id:
        raise HTTPException(status_code=404, detail="Client folder not found")

    update_data = folder_in.model_dump(exclude_none=True)
    updated = await db.clientfolder.update(
        where={"id": folder_id},
        data=update_data,
        include={"events": {"include": {"photos": True}}},
    )
    return _build_folder_response(updated)


# ── Find or Create a folder by name (for desktop uploader) ──────────────────
@router.post("/find-or-create", response_model=ClientFolderResponse)
async def find_or_create_folder(folder_in: ClientFolderCreate, current_user=Depends(get_current_user)):
    """Idempotent: returns existing folder if name matches, else creates new."""
    existing = await db.clientfolder.find_first(
        where={"userId": current_user.id, "name": folder_in.name},
        include={"events": {"include": {"photos": True}}},
    )
    if existing:
        return _build_folder_response(existing)

    folder = await db.clientfolder.create(
        data={
            "name": folder_in.name,
            "description": folder_in.description,
            "price": folder_in.price or 0,
            "isPaid": folder_in.isPaid or False,
            "whatsappNo": folder_in.whatsappNo,
            "userId": current_user.id,
        },
        include={"events": {"include": {"photos": True}}},
    )
    return _build_folder_response(folder)


# ── Delete a folder (and all its events/photos via cascade) ─────────────────
@router.delete("/{folder_id}")
async def delete_folder(folder_id: str, current_user=Depends(get_current_user)):
    folder = await db.clientfolder.find_unique(where={"id": folder_id})
    if not folder or folder.userId != current_user.id:
        raise HTTPException(status_code=404, detail="Client folder not found")
    await db.clientfolder.delete(where={"id": folder_id})
    return {"message": "Client folder deleted"}
