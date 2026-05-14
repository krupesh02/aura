import asyncio
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import db

async def check():
    await db.connect()
    try:
        folder_id = "49bf9a64-c931-458e-864d-5b8cce7f466d"
        photos = await db.photo.find_many(
            where={"event": {"clientFolderId": folder_id}},
            include={"event": True}
        )
        events = {}
        for p in photos:
            ename = p.event.name
            events[ename] = events.get(ename, 0) + 1
        
        print(f"Photo distribution:")
        for ename, count in events.items():
            print(f"Event: {ename}, Photos: {count}")
            
    finally:
        await db.disconnect()

if __name__ == "__main__":
    asyncio.run(check())
