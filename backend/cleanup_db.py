import asyncio
import os
import sys

# Add the current directory to sys.path to import database
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import db

async def main():
    await db.connect()
    try:
        print("Cleaning up payments table using raw SQL...")
        await db.execute_raw('DELETE FROM "payments"')
        print("Payments table cleaned.")
    except Exception as e:
        print("Error cleaning payments:", e)
        
    try:
        print("Cleaning up events table using raw SQL (optional, but helps if there are conflicts)...")
        # await db.execute_raw('DELETE FROM "events"') # Be careful here, maybe don't delete events yet
        pass
    except Exception as e:
        print("Error cleaning events:", e)

    await db.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
