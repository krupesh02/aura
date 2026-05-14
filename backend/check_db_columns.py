import asyncio
import os
import sys

# Add the current directory to sys.path to import database
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import db

async def main():
    await db.connect()
    try:
        # Try to fetch one event to see if it fails
        event = await db.event.find_first()
        print("Successfully fetched event:", event)
    except Exception as e:
        print("Error fetching event:", e)
    
    # Try to check columns in payments
    try:
        payment = await db.payment.find_first()
        print("Successfully fetched payment:", payment)
    except Exception as e:
        print("Error fetching payment:", e)
        
    await db.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
