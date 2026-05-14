import asyncio
from database import db, connect_db, disconnect_db

async def check():
    await connect_db()
    events = await db.event.find_many()
    for e in events:
        print(f"ID: {e.id}, Name: {e.name}, WhatsApp: {e.whatsappNo}")
    await disconnect_db()

if __name__ == "__main__":
    asyncio.run(check())
