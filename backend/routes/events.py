from fastapi import APIRouter, Depends, HTTPException
from typing import List
from models.event import EventCreate, EventUpdate, EventResponse
from routes.auth import get_current_user
from database import db

router = APIRouter()


@router.get("/", response_model=List[EventResponse])
async def list_events(current_user=Depends(get_current_user)):
    events = await db.event.find_many(
        where={"clientFolder": {"userId": current_user.id}, "status": {"not": "DELETED"}},
        include={"photos": True, "clientFolder": True},
        order={"createdAt": "desc"}
    )
    return [
        EventResponse(
            id=e.id,
            name=e.name,
            description=e.description,
            coverUrl=e.coverUrl,
            eventDate=e.eventDate,
            status=e.status,
            clientFolderId=e.clientFolderId,
            createdAt=e.createdAt,
            photoCount=len(e.photos) if e.photos else 0,
            photos=e.photos if e.photos else []
        )
        for e in events
    ]


@router.post("/", response_model=EventResponse)
async def create_event(event_in: EventCreate, current_user=Depends(get_current_user)):
    # Verify the client folder belongs to the user
    folder = await db.clientfolder.find_unique(where={"id": event_in.clientFolderId})
    if not folder or folder.userId != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to create events in this folder")

    event = await db.event.create(
        data={
            "name": event_in.name,
            "description": event_in.description,
            "eventDate": event_in.eventDate,
            "clientFolderId": event_in.clientFolderId,
        },
        include={"photos": True},
    )
    return EventResponse(
        id=event.id,
        name=event.name,
        description=event.description,
        coverUrl=event.coverUrl,
        eventDate=event.eventDate,
        status=event.status,
        clientFolderId=event.clientFolderId,
        createdAt=event.createdAt,
        photoCount=len(event.photos) if event.photos else 0,
        photos=event.photos if event.photos else []
    )


@router.post("/find-or-create", response_model=EventResponse)
async def find_or_create_event(event_in: EventCreate, current_user=Depends(get_current_user)):
    """Idempotent: returns existing event if name matches in this folder, else creates new."""
    folder = await db.clientfolder.find_unique(where={"id": event_in.clientFolderId})
    if not folder or folder.userId != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    existing = await db.event.find_first(
        where={
            "clientFolderId": event_in.clientFolderId,
            "name": event_in.name,
            "status": {"not": "DELETED"},
        },
        include={"photos": True},
    )
    if existing:
        return EventResponse(
            id=existing.id, name=existing.name, description=existing.description,
            coverUrl=existing.coverUrl, eventDate=existing.eventDate, status=existing.status,
            clientFolderId=existing.clientFolderId, createdAt=existing.createdAt,
            photoCount=len(existing.photos) if existing.photos else 0,
            photos=existing.photos if existing.photos else []
        )

    event = await db.event.create(
        data={
            "name": event_in.name,
            "description": event_in.description,
            "eventDate": event_in.eventDate,
            "clientFolderId": event_in.clientFolderId,
        },
        include={"photos": True},
    )
    return EventResponse(
        id=event.id, name=event.name, description=event.description,
        coverUrl=event.coverUrl, eventDate=event.eventDate, status=event.status,
        clientFolderId=event.clientFolderId, createdAt=event.createdAt,
        photoCount=len(event.photos) if event.photos else 0,
        photos=event.photos if event.photos else []
    )


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(event_id: str, current_user=Depends(get_current_user)):
    event = await db.event.find_unique(
        where={"id": event_id},
        include={"photos": True, "clientFolder": True},
    )
    if not event or not event.clientFolder or event.clientFolder.userId != current_user.id:
        raise HTTPException(status_code=404, detail="Event not found")

    return EventResponse(
        id=event.id,
        name=event.name,
        description=event.description,
        coverUrl=event.coverUrl,
        eventDate=event.eventDate,
        status=event.status,
        clientFolderId=event.clientFolderId,
        createdAt=event.createdAt,
        photoCount=len(event.photos) if event.photos else 0,
        photos=event.photos if event.photos else []
    )


@router.put("/{event_id}", response_model=EventResponse)
async def update_event(event_id: str, event_in: EventUpdate, current_user=Depends(get_current_user)):
    event = await db.event.find_unique(
        where={"id": event_id},
        include={"clientFolder": True}
    )
    if not event or not event.clientFolder or event.clientFolder.userId != current_user.id:
        raise HTTPException(status_code=404, detail="Event not found")

    update_data = event_in.model_dump(exclude_none=True)
    updated = await db.event.update(
        where={"id": event_id},
        data=update_data,
        include={"photos": True},
    )
    return EventResponse(
        id=updated.id,
        name=updated.name,
        description=updated.description,
        coverUrl=updated.coverUrl,
        eventDate=updated.eventDate,
        status=updated.status,
        clientFolderId=updated.clientFolderId,
        createdAt=updated.createdAt,
        photoCount=len(updated.photos) if updated.photos else 0,
        photos=updated.photos if updated.photos else []
    )


@router.delete("/{event_id}")
async def delete_event(event_id: str, current_user=Depends(get_current_user)):
    event = await db.event.find_unique(
        where={"id": event_id},
        include={"clientFolder": True}
    )
    if not event or not event.clientFolder or event.clientFolder.userId != current_user.id:
        raise HTTPException(status_code=404, detail="Event not found")

    await db.event.update(where={"id": event_id}, data={"status": "DELETED"})
    return {"message": "Event deleted"}
