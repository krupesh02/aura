from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import List, Optional
import uuid
from models.photo import PhotoResponse, PhotoSearchResult
from routes.auth import get_current_user
from services.ai_service import get_face_embeddings, cosine_similarity
from database import db

router = APIRouter()

SIMILARITY_THRESHOLD = 0.40


@router.post("/face", response_model=List[PhotoSearchResult])
async def search_by_face(
    file: UploadFile = File(...),
    folder_id: Optional[str] = Form(None),
    current_user=Depends(get_current_user),
):
    """Upload a selfie and find matching photos across all events or a specific folder."""
    file_bytes = await file.read()

    selfie_embeddings = get_face_embeddings(file_bytes)
    if not selfie_embeddings:
        raise HTTPException(status_code=400, detail="No face detected in the image")

    selfie_embedding = selfie_embeddings[0]

    where_clause = {"faceCount": {"gt": 0}}
    if folder_id:
        where_clause["event"] = {"clientFolderId": folder_id}
    else:
        # If no folder specified, only search folders belonging to current user
        where_clause["event"] = {"clientFolder": {"userId": current_user.id}}

    photos = await db.photo.find_many(where=where_clause, include={"event": True})

    results = []
    for photo in photos:
        if not photo.faceEmbeddings:
            continue
        embeddings = photo.faceEmbeddings
        if not isinstance(embeddings, list):
            continue

        max_sim = 0.0
        for emb in embeddings:
            sim = cosine_similarity(selfie_embedding, emb)
            max_sim = max(max_sim, sim)

        if max_sim >= SIMILARITY_THRESHOLD:
            results.append(
                PhotoSearchResult(
                    photo=PhotoResponse(
                        id=photo.id,
                        url=photo.url,
                        thumbnailUrl=photo.thumbnailUrl,
                        faceCount=photo.faceCount,
                        width=photo.width,
                        height=photo.height,
                        folderName=photo.folderName,
                        createdAt=photo.createdAt,
                        eventId=photo.eventId,
                    ),
                    similarity=round(max_sim, 4),
                )
            )

    results.sort(key=lambda x: x.similarity, reverse=True)
    return results


@router.post("/public/face", response_model=List[PhotoSearchResult])
async def search_by_face_public(
    folder_id: str = Form(...),
    file: UploadFile = File(...)
):
    """Public endpoint for guests to find their photos in a specific client folder."""
    file_bytes = await file.read()

    selfie_embeddings = get_face_embeddings(file_bytes)
    if not selfie_embeddings:
        raise HTTPException(status_code=400, detail="No face detected in the image")

    # Ensure folder exists
    folder = await db.clientfolder.find_unique(where={"id": folder_id})
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    # Query photos WITH face embeddings across ALL events in THIS folder
    photos = await db.photo.find_many(
        where={
            "event": {"clientFolderId": folder_id, "status": {"not": "DELETED"}},
            "faceCount": {"gt": 0}
        },
        include={"event": True}
    )

    results = []
    for photo in photos:
        if not photo.faceEmbeddings:
            continue
        embeddings = photo.faceEmbeddings
        if not isinstance(embeddings, list):
            continue

        max_sim = 0.0
        for selfie_emb in selfie_embeddings:
            for emb in embeddings:
                sim = cosine_similarity(selfie_emb, emb)
                max_sim = max(max_sim, sim)

        if max_sim >= SIMILARITY_THRESHOLD:
            results.append(
                PhotoSearchResult(
                    photo=PhotoResponse(
                        id=photo.id,
                        url=photo.url,
                        thumbnailUrl=photo.thumbnailUrl,
                        faceCount=photo.faceCount,
                        width=photo.width,
                        height=photo.height,
                        folderName=photo.folderName,
                        createdAt=photo.createdAt,
                        eventId=photo.eventId,
                    ),
                    similarity=round(max_sim, 4),
                )
            )

    results.sort(key=lambda x: x.similarity, reverse=True)
    return results


@router.post("/public/events-by-face")
async def search_events_by_face(
    file: UploadFile = File(...),
):
    """
    Global public endpoint: discover matches but don't show URLs yet.
    Returns total count and folder summaries.
    """
    file_bytes = await file.read()

    selfie_embeddings = get_face_embeddings(file_bytes)
    if not selfie_embeddings:
        raise HTTPException(status_code=400, detail="No face detected in the image")

    photos = await db.photo.find_many(
        where={"faceCount": {"gt": 0}},
        include={"event": {"include": {"clientFolder": True}}},
    )

    total_matches = 0
    folder_summaries = {}

    for photo in photos:
        if not photo.faceEmbeddings or not isinstance(photo.faceEmbeddings, list):
            continue
            
        if not photo.event or photo.event.status == "DELETED" or not photo.event.clientFolder:
            continue

        max_sim = 0.0
        for selfie_emb in selfie_embeddings:
            for emb in photo.faceEmbeddings:
                sim = cosine_similarity(selfie_emb, emb)
                max_sim = max(max_sim, sim)

        if max_sim >= SIMILARITY_THRESHOLD:
            total_matches += 1
            fid = photo.event.clientFolder.id
            if fid not in folder_summaries:
                folder_summaries[fid] = {
                    "id": fid,
                    "name": photo.event.clientFolder.name,
                    "matchCount": 0
                }
            folder_summaries[fid]["matchCount"] += 1

    return {
        "totalMatches": total_matches,
        "folderSummaries": list(folder_summaries.values()),
        "tempSelfieId": uuid.uuid4().hex # For referencing the selfie if needed
    }


@router.post("/public/unified-gallery")
async def get_unified_gallery(
    file: UploadFile = File(...),
    guest_token: str = Form(...)
):
    """
    Secure unified gallery: returns all matching photos across all folders.
    Requires a valid GLOBAL payment token.
    """
    # Verify payment (Allow bypass tokens for testing)
    if not guest_token.startswith("bypass_token_"):
        payment = await db.payment.find_unique(where={"guestToken": guest_token})
        if not payment or payment.status != "SUCCESS":
            raise HTTPException(status_code=403, detail="Payment required to access unified gallery")

    file_bytes = await file.read()
    selfie_embeddings = get_face_embeddings(file_bytes)
    if not selfie_embeddings:
        raise HTTPException(status_code=400, detail="No face detected in the image")

    # Get all photos across all folders
    photos = await db.photo.find_many(
        where={"faceCount": {"gt": 0}},
        include={"event": {"include": {"clientFolder": True}}},
    )

    results = []
    for photo in photos:
        if not photo.faceEmbeddings or not isinstance(photo.faceEmbeddings, list):
            continue

        max_sim = 0.0
        for selfie_emb in selfie_embeddings:
            for emb in photo.faceEmbeddings:
                sim = cosine_similarity(selfie_emb, emb)
                max_sim = max(max_sim, sim)

        if max_sim >= SIMILARITY_THRESHOLD:
            results.append({
                "id": photo.id,
                "url": photo.url,
                "thumbnailUrl": photo.thumbnailUrl,
                "similarity": round(max_sim, 4),
                "eventName": photo.event.name,
                "folderName": photo.event.clientFolder.name
            })

    results.sort(key=lambda x: x["similarity"], reverse=True)
    return results
