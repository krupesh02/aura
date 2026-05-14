import asyncio
import os
import sys

# Add current directory to path
sys.path.append(os.getcwd())

from database import db

async def check_db():
    try:
        await db.connect()
        events = await db.event.find_many(include={'photos': True})
        print(f"Total Events: {len(events)}")
        for e in events:
            print(f"Event ID: {e.id} | Name: {e.name} | Photos: {len(e.photos)}")
            for p in e.photos[:3]: # show first 3 photos
                print(f"  - Photo URL: {p.url[:60]}...")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await db.disconnect()

if __name__ == "__main__":
    asyncio.run(check_db())
