import asyncio
import os
import dotenv
dotenv.load_dotenv()
import asyncpg

DB_URL = os.getenv("DATABASE_URL")

async def main():
    conn = await asyncpg.connect(DB_URL)
    print("Connected to DB.")

    try:
        print("Step 1: Creating client_folders table...")
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS client_folders (
                id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name          TEXT NOT NULL,
                description   TEXT,
                cover_url     TEXT,
                price         FLOAT NOT NULL DEFAULT 0,
                is_paid       BOOLEAN NOT NULL DEFAULT false,
                whatsapp_no   TEXT,
                user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
                updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
            );
        """)
        print("  [OK] client_folders table created.")

        print("Step 2: Adding client_folder_id column to events (nullable)...")
        await conn.execute("""
            ALTER TABLE events
            ADD COLUMN IF NOT EXISTS client_folder_id UUID REFERENCES client_folders(id) ON DELETE CASCADE;
        """)
        print("  [OK] Column added.")

        print("Step 3: Migrating existing events to ClientFolders...")
        events = await conn.fetch("""
            SELECT id, name, description, cover_url, price, is_paid, whatsapp_no, user_id
            FROM events
            WHERE client_folder_id IS NULL;
        """)
        print(f"  Found {len(events)} event(s) to migrate.")

        for ev in events:
            folder_id = await conn.fetchval("""
                INSERT INTO client_folders (name, description, cover_url, price, is_paid, whatsapp_no, user_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id;
            """, ev["name"], ev["description"], ev["cover_url"],
                ev["price"] or 0, ev["is_paid"] or False, ev["whatsapp_no"], ev["user_id"])

            await conn.execute("""
                UPDATE events SET client_folder_id = $1 WHERE id = $2;
            """, folder_id, ev["id"])
            print(f"  [OK] Event '{ev['name']}' -> ClientFolder '{folder_id}'")

        print("Step 4: Setting client_folder_id NOT NULL...")
        await conn.execute("""
            ALTER TABLE events ALTER COLUMN client_folder_id SET NOT NULL;
        """)
        print("  [OK] Done.")

        print("Step 5: Migrating payments to client_folder_id...")
        col_exists = await conn.fetchval("""
            SELECT COUNT(*) FROM information_schema.columns
            WHERE table_name='payments' AND column_name='client_folder_id';
        """)
        if not col_exists:
            await conn.execute("""
                ALTER TABLE payments
                ADD COLUMN client_folder_id UUID REFERENCES client_folders(id) ON DELETE CASCADE;
            """)
            await conn.execute("""
                UPDATE payments p
                SET client_folder_id = e.client_folder_id
                FROM events e
                WHERE p.event_id = e.id
                  AND p.client_folder_id IS NULL;
            """)
            print("  [OK] Payments migrated.")
        else:
            print("  [OK] Column already exists, skipping.")

        print("\nMigration complete!")

    except Exception as e:
        print(f"\n[FAIL] Migration failed: {e}")
        raise
    finally:
        await conn.close()
        print("Connection closed.")

if __name__ == "__main__":
    asyncio.run(main())
