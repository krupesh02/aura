import sys
import os

# Ensure backend path is in sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.ai_service import get_face_embeddings

try:
    with open("c:/Users/KRUPESH/Desktop/photo-event-platform/frontend/public/sunset-bg.png", "rb") as f:
        image_bytes = f.read()
    print("Extracting embeddings...")
    embeddings = get_face_embeddings(image_bytes)
    print("Found embeddings:", len(embeddings))
except Exception as e:
    print("Error:", e)
