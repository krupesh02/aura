from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ClientFolderCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: Optional[float] = 0.0
    isPaid: Optional[bool] = False
    whatsappNo: Optional[str] = None


class ClientFolderUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    coverUrl: Optional[str] = None
    price: Optional[float] = None
    isPaid: Optional[bool] = None
    whatsappNo: Optional[str] = None


class SubEventSummary(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    eventDate: Optional[datetime] = None
    status: str
    photoCount: int = 0
    coverUrl: Optional[str] = None
    createdAt: datetime

    model_config = {"from_attributes": True}


class ClientFolderResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    coverUrl: Optional[str] = None
    price: float = 0.0
    isPaid: bool = False
    whatsappNo: Optional[str] = None
    createdAt: datetime
    userId: str
    eventCount: int = 0
    totalPhotos: int = 0
    events: Optional[List[SubEventSummary]] = []

    model_config = {"from_attributes": True}
