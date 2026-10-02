import os
import sqlite3
from flask import Flask, request, jsonify, send_from_directory, session
from flask_cors import CORS
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from database import get_db, init_db

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__, static_folder=BASE_DIR, static_url_path="")
app.secret_key = "lost-and-found-super-secret-key-change-in-production"
CORS(app)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024  # 8MB max upload

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

# Initialize DB on start
init_db()

# ----------------- Static Frontend Routes -----------------

@app.route("/")
def index():
    return send_from_directory(BASE_DIR, "index.html")

@app.route("/items.html")
def items_page():
    return send_from_directory(BASE_DIR, "items.html")

@app.route("/report.html")
def report_page():
    return send_from_directory(BASE_DIR, "report.html")

@app.route("/login.html")
def login_page():
    return send_from_directory(BASE_DIR, "login.html")

@app.route("/contact.html")
def contact_page():
    return send_from_directory(BASE_DIR, "contact.html")

@app.route("/uploads/<filename>")
def uploaded_file(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

# ----------------- API Routes: Stats -----------------

@app.route("/api/stats", methods=["GET"])
def get_stats():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM items WHERE type = 'lost' AND status = 'open'")
    lost_count = cursor.fetchone()["count"]
    cursor.execute("SELECT COUNT(*) as count FROM items WHERE type = 'found' AND status = 'open'")
    found_count = cursor.fetchone()["count"]
    cursor.execute("SELECT COUNT(*) as count FROM items WHERE status = 'resolved'")
    resolved_count = cursor.fetchone()["count"]
    cursor.execute("SELECT COUNT(*) as count FROM items")
    total_count = cursor.fetchone()["count"]
    conn.close()
    return jsonify({
        "lost": lost_count,
        "found": found_count,
        "resolved": resolved_count,
        "total": total_count
    })

# ----------------- API Routes: Items -----------------

@app.route("/api/items", methods=["GET"])
def list_items():
    item_type = request.args.get("type")
    category = request.args.get("category")
    search = request.args.get("search")
    status = request.args.get("status")

    query = "SELECT * FROM items WHERE 1=1"
    params = []

    if item_type and item_type.lower() in ("lost", "found"):
        query += " AND type = ?"
        params.append(item_type.lower())

    if category and category.lower() != "all":
        query += " AND LOWER(category) = ?"
        params.append(category.lower())

    if status and status.lower() != "all":
        query += " AND status = ?"
        params.append(status.lower())

    if search:
        search_pattern = f"%{search.strip().lower()}%"
        query += " AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(location) LIKE ?)"
        params.extend([search_pattern, search_pattern, search_pattern])

    query += " ORDER BY id DESC"

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(query, params)
    rows = cursor.fetchall()
    items = [dict(row) for row in rows]
    conn.close()
    return jsonify(items)

@app.route("/api/items/<int:item_id>", methods=["GET"])
def get_item(item_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM items WHERE id = ?", (item_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return jsonify({"error": "Item not found"}), 404
    return jsonify(dict(row))

@app.route("/api/items", methods=["POST"])
def create_item():
    # Supports multipart/form-data (with image file) or json
    if request.content_type and "multipart/form-data" in request.content_type:
        title = request.form.get("title") or request.form.get("itemName")
        category = request.form.get("category")
        item_type = request.form.get("type", "lost").lower()
        location = request.form.get("location")
        item_date = request.form.get("date") or request.form.get("item_date")
        description = request.form.get("description", "")
        contact = request.form.get("contact")
        
        image_url = None
        if "image" in request.files:
            file = request.files["image"]
            if file and file.filename and allowed_file(file.filename):
                import time
                filename = f"{int(time.time())}_{secure_filename(file.filename)}"
                file.save(os.path.join(app.config["UPLOAD_FOLDER"], filename))
                image_url = f"/uploads/{filename}"
    else:
        data = request.get_json(silent=True) or {}
        title = data.get("title") or data.get("itemName")
        category = data.get("category")
        item_type = str(data.get("type", "lost")).lower()
        location = data.get("location")
        item_date = data.get("date") or data.get("item_date")
        description = data.get("description", "")
        contact = data.get("contact")
        image_url = data.get("image_url")

    if not title or not category or not location or not item_date or not contact:
        return jsonify({"error": "Missing required fields (title, category, location, date, contact)"}), 400

    if item_type not in ("lost", "found"):
        item_type = "lost"

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO items (title, category, type, location, item_date, description, contact, image_url, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open')
    """, (title.strip(), category.strip(), item_type, location.strip(), item_date.strip(), description.strip(), contact.strip(), image_url))
    conn.commit()
    new_id = cursor.lastrowid
    cursor.execute("SELECT * FROM items WHERE id = ?", (new_id,))
    item = dict(cursor.fetchone())
    conn.close()

    return jsonify(item), 201

@app.route("/api/items/<int:item_id>/status", methods=["PATCH"])
def update_item_status(item_id):
    data = request.get_json(silent=True) or {}
    new_status = data.get("status")
    if new_status not in ("open", "resolved"):
        return jsonify({"error": "Invalid status value. Must be 'open' or 'resolved'"}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE items SET status = ? WHERE id = ?", (new_status, item_id))
    conn.commit()
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({"error": "Item not found"}), 404

    cursor.execute("SELECT * FROM items WHERE id = ?", (item_id,))
    item = dict(cursor.fetchone())
    conn.close()
    return jsonify(item)

@app.route("/api/items/<int:item_id>", methods=["DELETE"])
def delete_item(item_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM items WHERE id = ?", (item_id,))
    conn.commit()
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({"error": "Item not found"}), 404
    conn.close()
    return jsonify({"success": True, "message": "Item deleted successfully"})

# ----------------- API Routes: Authentication -----------------

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    name = data.get("name", "").strip() or email.split("@")[0]

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    conn = get_db()
    cursor = conn.cursor()
    try:
        pw_hash = generate_password_hash(password)
        cursor.execute("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)", (name, email, pw_hash))
        conn.commit()
        user_id = cursor.lastrowid
        session["user_id"] = user_id
        session["user_name"] = name
        session["user_email"] = email
        conn.close()
        return jsonify({"id": user_id, "name": name, "email": email}), 201
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"error": "An account with this email already exists"}), 409

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    conn.close()

    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Invalid email or password"}), 401

    session["user_id"] = user["id"]
    session["user_name"] = user["name"]
    session["user_email"] = user["email"]

    return jsonify({
        "id": user["id"],
        "name": user["name"],
        "email": user["email"]
    })

@app.route("/api/auth/me", methods=["GET"])
def current_user():
    if "user_id" in session:
        return jsonify({
            "authenticated": True,
            "id": session["user_id"],
            "name": session.get("user_name"),
            "email": session.get("user_email")
        })
    return jsonify({"authenticated": False})

@app.route("/api/auth/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"success": True})

if __name__ == "__main__":
    print("Starting Lost & Found Full-Stack server at http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=True)
