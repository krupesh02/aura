import cv2
import numpy as np
from deepface import DeepFace
from typing import List

# Keep Facenet to stay compatible with existing stored embeddings (128-dim)
FACE_MODEL = "Facenet"
# ssd is better than opencv for face detection and needs no extra packages
FACE_DETECTOR = "ssd"

def get_face_embeddings(image_bytes: bytes) -> List[List[float]]:
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    try:
        # Primary attempt: strict detection with ssd
        results = DeepFace.represent(
            img_path=img, 
            model_name=FACE_MODEL, 
            enforce_detection=True,
            detector_backend=FACE_DETECTOR
        )
        embeddings = [
            res["embedding"] for res in results 
            if res.get("face_confidence", 1.0) > 0.5
        ]
        if embeddings:
            return list(embeddings)
    except Exception as e:
        print("Primary face extraction error:", e)

    # Fallback: relax detection for tricky images (low light, angles, small faces)
    try:
        results = DeepFace.represent(
            img_path=img,
            model_name=FACE_MODEL,
            enforce_detection=False,
            detector_backend=FACE_DETECTOR
        )
        embeddings = [
            res["embedding"] for res in results
            if res.get("face_confidence", 1.0) > 0.3
        ]
        return list(embeddings) if embeddings else []
    except Exception as e:
        print("Fallback face extraction error:", e)
        # Second Fallback: use opencv (most lenient, though less accurate)
        try:
            results = DeepFace.represent(
                img_path=img,
                model_name=FACE_MODEL,
                enforce_detection=False,
                detector_backend="opencv"
            )
            return [res["embedding"] for res in results]
        except Exception as e:
            print("Final face extraction error:", e)
            return []

def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    v1 = np.array(vec1)
    v2 = np.array(vec2)
    norm1 = np.linalg.norm(v1)
    norm2 = np.linalg.norm(v2)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return float(np.dot(v1, v2) / (norm1 * norm2))
