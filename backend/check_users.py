import asyncio
import sys
import os

# Add the current directory to sys.path to import database
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import db
from core.security import get_password_hash

async def main():
    await db.connect()
    users = await db.user.find_many()
    print("--- Current Users ---")
    for u in users:
        print(f"ID: {u.id}, Email: {u.email}, Name: {u.name}, Role: {u.role}")
    
    admin_email = "admin@gmail.com"
    admin_password = "admin" # Default password for testing
    
    admin = await db.user.find_unique(where={"email": admin_email})
    if not admin:
        print(f"\nCreating admin user: {admin_email}")
        await db.user.create(
            data={
                "email": admin_email,
                "name": "Admin User",
                "hashedPassword": get_password_hash(admin_password),
                "role": "ADMIN"
            }
        )
        print("Admin user created successfully.")
    else:
        print(f"\nAdmin user {admin_email} already exists. Resetting password to 'admin123'...")
        await db.user.update(
            where={"email": admin_email},
            data={"hashedPassword": get_password_hash("admin123")}
        )
        print("Admin password reset to 'admin123'")

    await db.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
