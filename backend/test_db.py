import asyncio
from database import db
async def main():
  await db.connect()
  events = await db.event.find_many(include={'photos': True})
  for e in events:
    print(e.name, len(e.photos))
  await db.disconnect()
asyncio.run(main())
