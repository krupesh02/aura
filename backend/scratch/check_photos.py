import asyncio
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import db
import json

async def check():
    await db.connect()
    try:
        folder_id = "49bf9a64-c931-458e-864d-5b8cce7f466d"
        photos = await db.photo.find_many(
            where={"event": {"clientFolderId": folder_id}},
            include={"event": True}
        )
        print(f"Total photos found: {len(photos)}")
        for p in photos:
            print(f"ID: {p.id}, URL: {p.url}, Thumb: {p.thumbnailUrl}")
    finally:
        await db.disconnect()

if __name__ == "__main__":
    asyncio.run(check())
