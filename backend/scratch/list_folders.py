import asyncio
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import db

async def check():
    await db.connect()
    try:
        folders = await db.clientfolder.find_many(include={"events": {"include": {"photos": True}}})
        print(f"Total folders: {len(folders)}")
        for f in folders:
            total_photos = sum(len(e.photos) for e in f.events)
            print(f"ID: {f.id}, Name: {f.name}, Events: {len(f.events)}, Photos: {total_photos}")
    finally:
        await db.disconnect()

if __name__ == "__main__":
    asyncio.run(check())
