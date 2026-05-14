import os
from dotenv import load_dotenv
from prisma import Prisma

# Load environment variables from the root .env file
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

db = Prisma(http={"timeout": 300.0})

async def connect_db():
    await db.connect()

async def disconnect_db():
    await db.disconnect()
