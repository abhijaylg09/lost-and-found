import sqlite3
import os
from werkzeug.security import generate_password_hash, check_password_hash

DB_DIR = os.path.dirname(os.path.abspath(__file__))

def get_db_path():
    # On Vercel or read-only filesystems, use /tmp
    if os.environ.get("VERCEL") or not os.access(DB_DIR, os.W_OK):
        return "/tmp/lost_and_found.db"
    return os.path.join(DB_DIR, "lost_and_found.db")

DB_PATH = get_db_path()

def get_db():
    global DB_PATH
    DB_PATH = get_db_path()
    needs_init = not os.path.exists(DB_PATH)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    if needs_init:
        init_db(existing_conn=conn)
    return conn

def init_db(existing_conn=None):
    should_close = False
    if existing_conn:
        conn = existing_conn
    else:
        conn = sqlite3.connect(get_db_path())
        conn.row_factory = sqlite3.Row
        should_close = True

    cursor = conn.cursor()
    
    # Create users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Create items table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('lost', 'found')),
            location TEXT NOT NULL,
            item_date TEXT NOT NULL,
            description TEXT,
            contact TEXT NOT NULL,
            image_url TEXT,
            status TEXT DEFAULT 'open' CHECK(status IN ('open', 'resolved')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()

    # Seed initial items if empty
    cursor.execute("SELECT COUNT(*) as count FROM items")
    count = cursor.fetchone()["count"]
    if count == 0:
        sample_items = [
            (
                "Black Leather Wallet",
                "Accessories",
                "lost",
                "Library 2nd Floor Study Room",
                "2026-09-28",
                "Contains college student ID, driving license, and blue metro card. Reward offered for return.",
                "student.alex@example.com",
                None,
                "open"
            ),
            (
                "Apple AirPods Pro (2nd Gen)",
                "Electronics",
                "found",
                "Campus Cafeteria - Corner Booth",
                "2026-09-29",
                "Found on the table in a white charging case with a small sticker on back.",
                "cafe.staff@example.com",
                None,
                "open"
            ),
            (
                "Calculus & Linear Algebra Textbook",
                "Books",
                "lost",
                "Science Block Room 302",
                "2026-09-30",
                "Hardcover 11th edition. Has handwritten notes and yellow highlighter markings.",
                "maths_major@example.com",
                None,
                "open"
            ),
            (
                "Silver Keychain with 4 Keys",
                "Other",
                "found",
                "Gym Locker Area / Entrance",
                "2026-10-01",
                "Set of brass and silver keys attached to a blue car fob and mini carabiner.",
                "gymdesk@example.com",
                None,
                "open"
            ),
            (
                "Blue Hydro Flask Water Bottle",
                "Accessories",
                "found",
                "Auditorium Row F",
                "2026-10-01",
                "32oz navy blue bottle with outdoors/national park stickers.",
                "security@example.com",
                None,
                "resolved"
            )
        ]

        cursor.executemany("""
            INSERT INTO items (title, category, type, location, item_date, description, contact, image_url, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, sample_items)
        conn.commit()

    if should_close:
        conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully.")
