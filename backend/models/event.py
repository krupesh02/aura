from pydantic import BaseModel
from models.photo import PhotoResponse
from typing import Optional, List
from datetime import datetime


class EventCreate(BaseModel):
    name: str
    description: Optional[str] = None
    eventDate: Optional[datetime] = None
    clientFolderId: str  # Required — every event belongs to a folder


class EventUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    eventDate: Optional[datetime] = None
    status: Optional[str] = None
    coverUrl: Optional[str] = None


class EventResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    coverUrl: Optional[str] = None
    eventDate: Optional[datetime] = None
    status: str
    clientFolderId: str
    createdAt: datetime
    photoCount: int = 0
    photos: Optional[List[PhotoResponse]] = []

    model_config = {"from_attributes": True}
