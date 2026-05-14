from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Response
from fastapi.responses import StreamingResponse
from typing import List
import math
import io
import json as json_module
from prisma import Json
from models.photo import PhotoResponse, PaginatedPhotos
from routes.auth import get_current_user
from services.cloud_service import upload_image, delete_image
from services.ai_service import get_face_embeddings
from database import db
import httpx

router = APIRouter()


@router.get("/{photo_id}/download")
async def download_photo_proxy(photo_id: str):
    """Proxy endpoint to download photos, bypassing CORS and forcing attachment."""
    photo = await db.photo.find_unique(where={"id": photo_id})
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    # We use httpx to fetch the image from its URL (Google Drive/Cloudinary)
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(photo.url, follow_redirects=True)
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to fetch image from storage")
            
            # Extract filename from URL or publicId
            filename = f"photo_{photo_id}.jpg"
            if photo.publicId:
                filename = f"{photo.publicId}.jpg"
            
            return Response(
                content=response.content,
                media_type=response.headers.get("content-type", "image/jpeg"),
                headers={
                    "Content-Disposition": f'attachment; filename="{filename}"',
                    "Access-Control-Expose-Headers": "Content-Disposition"
                }
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")


@router.post("/upload", response_model=PhotoResponse)
async def upload_photo(
    event_id: str = Form(...),
    file: UploadFile = File(...),
    folder_name: str = Form("General"),
    current_user=Depends(get_current_user),
):
    # Verify event exists
    event = await db.event.find_unique(where={"id": event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Read file bytes
    file_bytes = await file.read()

    # Upload to Cloudinary (COMMENTED OUT FOR GOOGLE DRIVE)
    # result = upload_image(file_bytes, folder=f"photoai/events/{event_id}")
    # if not result:
    #     raise HTTPException(status_code=500, detail="Upload failed")

    # Upload to Google Drive
    from services.drive_service import upload_to_drive
    try:
        filename = file.filename if file.filename else "image.jpg"
        mime_type = file.content_type if file.content_type else "image/jpeg"
        drive_res = upload_to_drive(file_bytes, filename=filename, mime_type=mime_type)
        result = {
            "url": drive_res["secure_url"],
            "public_id": drive_res["public_id"],
            "thumbnail_url": drive_res["thumbnail_url"],
            "width": None,
            "height": None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Google Drive upload failed: {str(e)}")

    # Extract face embeddings
    embeddings = get_face_embeddings(file_bytes)

    # Set cover URL if event has none
    if not event.coverUrl:
        await db.event.update(
            where={"id": event_id}, data={"coverUrl": result["url"]}
        )

    data_payload = {
        "url": result["url"],
        "publicId": result.get("public_id"),
        "thumbnailUrl": result.get("thumbnail_url", result["url"]),
        "faceCount": len(embeddings) if embeddings else 0,
        "width": result.get("width"),
        "height": result.get("height"),
        "folderName": folder_name,
        "eventId": event_id,
        "uploadedById": current_user.id,
    }
    
    if embeddings:
        data_payload["faceEmbeddings"] = Json(embeddings)

    # Save photo to DB
    photo = await db.photo.create(
        data=data_payload
    )

    return PhotoResponse(
        id=photo.id,
        url=photo.url,
        thumbnailUrl=photo.thumbnailUrl,
        faceCount=photo.faceCount,
        width=photo.width,
        height=photo.height,
        folderName=photo.folderName,
        createdAt=photo.createdAt,
        eventId=photo.eventId,
    )


@router.get("/event/{event_id}", response_model=PaginatedPhotos)
async def get_event_photos(
    event_id: str,
    page: int = 1,
    page_size: int = 20,
    current_user=Depends(get_current_user),
):
    skip = (page - 1) * page_size

    total = await db.photo.count(where={"eventId": event_id})
    photos = await db.photo.find_many(
        where={"eventId": event_id},
        skip=skip,
        take=page_size,
        order={"createdAt": "desc"},
    )

    return PaginatedPhotos(
        photos=[
            PhotoResponse(
                id=p.id,
                url=p.url,
                thumbnailUrl=p.thumbnailUrl,
                faceCount=p.faceCount,
                width=p.width,
                height=p.height,
                folderName=p.folderName,
                createdAt=p.createdAt,
                eventId=p.eventId,
            )
            for p in photos
        ],
        total=total,
        page=page,
        pageSize=page_size,
        totalPages=math.ceil(total / page_size) if total > 0 else 0,
    )


@router.get("/public/event/{event_id}", response_model=PaginatedPhotos)
async def get_public_event_photos(
    event_id: str,
    page: int = 1,
    page_size: int = 100,
):
    """Public endpoint to fetch all photos of an event for guests."""
    skip = (page - 1) * page_size

    # Ensure event exists and is not deleted
    event = await db.event.find_unique(where={"id": event_id})
    if not event or event.status == "DELETED":
        raise HTTPException(status_code=404, detail="Event not found")

    total = await db.photo.count(where={"eventId": event_id})
    photos = await db.photo.find_many(
        where={"eventId": event_id},
        skip=skip,
        take=page_size,
        order={"createdAt": "desc"},
    )

    return PaginatedPhotos(
        photos=[
            PhotoResponse(
                id=p.id,
                url=p.url,
                thumbnailUrl=p.thumbnailUrl,
                faceCount=p.faceCount,
                width=p.width,
                height=p.height,
                folderName=p.folderName,
                createdAt=p.createdAt,
                eventId=p.eventId,
            )
            for p in photos
        ],
        total=total,
        page=page,
        pageSize=page_size,
        totalPages=math.ceil(total / page_size) if total > 0 else 0,
    )


@router.get("/public/folder/{folder_id}", response_model=PaginatedPhotos)
async def get_public_folder_photos(
    folder_id: str,
    page: int = 1,
    page_size: int = 100,
):
    """Public endpoint to fetch all photos of a folder (across all its events)."""
    skip = (page - 1) * page_size

    total = await db.photo.count(
        where={
            "event": {"clientFolderId": folder_id, "status": {"not": "DELETED"}}
        }
    )
    photos = await db.photo.find_many(
        where={
            "event": {"clientFolderId": folder_id, "status": {"not": "DELETED"}}
        },
        skip=skip,
        take=page_size,
        order={"createdAt": "desc"},
    )

    return PaginatedPhotos(
        photos=[
            PhotoResponse(
                id=p.id,
                url=p.url,
                thumbnailUrl=p.thumbnailUrl,
                faceCount=p.faceCount,
                width=p.width,
                height=p.height,
                folderName=p.folderName,
                createdAt=p.createdAt,
                eventId=p.eventId,
            )
            for p in photos
        ],
        total=total,
        page=page,
        pageSize=page_size,
        totalPages=math.ceil(total / page_size) if total > 0 else 0,
    )


@router.delete("/{photo_id}")
async def delete_photo(photo_id: str, current_user=Depends(get_current_user)):
    photo = await db.photo.find_unique(where={"id": photo_id})
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    # Delete from Cloudinary (COMMENTED OUT FOR GOOGLE DRIVE)
    # if photo.publicId:
    #     delete_image(photo.publicId)

    # Delete from Google Drive
    from services.drive_service import delete_from_drive
    if photo.publicId:
        delete_from_drive(photo.publicId)

    # Delete from DB
    await db.photo.delete(where={"id": photo_id})
    return {"message": "Photo deleted"}
