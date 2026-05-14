from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class PhotoResponse(BaseModel):
    id: str
    url: str
    thumbnailUrl: Optional[str] = None
    faceCount: int = 0
    width: Optional[int] = None
    height: Optional[int] = None
    folderName: Optional[str] = "General"
    createdAt: datetime
    eventId: str

    model_config = {"from_attributes": True}

class PhotoSearchResult(BaseModel):
    photo: PhotoResponse
    similarity: float

class PaginatedPhotos(BaseModel):
    photos: List[PhotoResponse]
    total: int
    page: int
    pageSize: int
    totalPages: int
