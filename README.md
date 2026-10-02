# 🔍 Lost & Found — Community Belongings Network

A premium, full-stack **Lost & Found** web application built with **Flask**, **SQLite**, and a handcrafted glassmorphic UI. Report missing items, browse found belongings, and reconnect with lost property — all through a beautiful, animation-rich interface.

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/Flask-2.x-000000?style=for-the-badge&logo=flask&logoColor=white" alt="Flask">
  <img src="https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite">
  <img src="https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/CSS3-Modern-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3">
</p>

---

## ✨ Features

### Core Functionality
- 📝 **Item Reporting** — Report lost or found belongings with category, location, date, description, contact info, and optional photo upload
- 🔎 **Directory & Search** — Real-time search with filters for category, type (Lost/Found), and status
- 📊 **Live Statistics** — Animated counters for active lost reports, found items, and reunited belongings
- ✅ **Item Resolution** — Mark items as "Reunited / Resolved" or reopen them
- 🔐 **Authentication** — User registration & login with secure bcrypt-level password hashing
- 📬 **Contact Page** — Dedicated contact page with form, info cards, and FAQ section

### Premium UI & Animations
- 🌙 **Dark / Light Mode** — Persistent theme toggle with smooth transitions
- 🪟 **Glassmorphism Design** — Frosted glass panels with `backdrop-filter` blur & specular highlights
- ✨ **Live Sparkle Canvas** — Twinkling starfield with interactive mouse proximity effects
- 🌈 **Ambient Aurora** — Floating chromatic gradient blobs in the background
- 🎯 **Cursor Spotlight** — Linear/Stripe-style radial glow on card hover
- 💫 **Scroll Reveal** — Elements animate into view as you scroll (fade, slide, scale)
- 🧲 **Magnetic 3D Tilt** — Cards subtly rotate in 3D following your cursor
- 🔘 **Click Ripple** — Material-design ripple effect on all buttons
- 🔮 **Cursor Glow Follower** — Ambient light blob follows the cursor across the page
- 🪐 **Orbit Rings** — Spinning concentric rings with glowing dot tracers in the hero section
- 🎆 **Floating Particles** — Colored particles drifting through every section
- 📐 **Parallax Scroll** — Aurora and orbit rings shift at different speeds for depth
- ✍️ **Logo Letter Wave** — Each letter in "Lost&Found" gently bobs in a staggered wave
- 🔤 **Hero Text Shimmer** — Sweeping light shimmer across the hero heading
- ☀️ **Rotating Sun Icon** — The dark mode toggle sun spins continuously
- 📢 **Live Activity Ticker** — Scrolling marquee bar with real-time item events
- 🃏 **Floating Showcase Cards** — Bobbing glass cards in the hero section
- 🌊 **Footer Wave Divider** — Organic wave clip-path transition to the footer

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.10+** (tested on Python 3.12)
- **pip** (Python package manager)

### 1. Clone the Repository

```bash
git clone https://github.com/abhijaylg09/lost-and-found.git
cd lost-and-found
```

### 2. Create & Activate Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Activate (macOS / Linux)
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the Application

```bash
python app.py
```

The server starts at **`http://127.0.0.1:5000`** — open it in your browser!

---

## 📁 Project Structure

```
lost-and-found/
├── app.py                # Flask server, REST API endpoints, and routing
├── database.py           # SQLite schema initialization & seed data
├── requirements.txt      # Python dependencies (Flask, Flask-CORS, Werkzeug)
├── .gitignore            # Git ignore configuration
│
├── index.html            # Landing page — hero, live stats, recent items
├── items.html            # Searchable items directory with filter controls
├── report.html           # Report lost/found item form with photo upload
├── contact.html          # Contact page — form, info cards, FAQ
├── login.html            # Authentication page (Sign In & Register tabs)
│
├── style.css             # Complete design system — tokens, glassmorphism,
│                         # animations, dark mode, responsive layout
├── app.js                # Client-side JS — theme, sparkles, aurora, tilt,
│                         # ripple, scroll-reveal, cursor glow, orbit rings
│
├── uploads/              # User-uploaded item images (gitignored)
└── lost_and_found.db     # SQLite database (auto-generated, gitignored)
```

---

## 📡 REST API Reference

| Method   | Endpoint                  | Description                                               |
|----------|---------------------------|-----------------------------------------------------------|
| `GET`    | `/api/items`              | List items with optional filters (`?type=lost&category=Electronics&search=wallet&status=open`) |
| `GET`    | `/api/items/<id>`         | Get a single item by ID                                   |
| `POST`   | `/api/items`              | Create a new item (multipart form with optional image)    |
| `PATCH`  | `/api/items/<id>/status`  | Update status to `open` or `resolved`                     |
| `DELETE` | `/api/items/<id>`         | Delete an item report                                     |
| `GET`    | `/api/stats`              | Get live counts (lost, found, resolved)                   |
| `POST`   | `/api/auth/register`      | Register a new user account                               |
| `POST`   | `/api/auth/login`         | Log in with email & password                              |
| `GET`    | `/api/auth/me`            | Check current session / auth status                       |
| `POST`   | `/api/auth/logout`        | Log out the current user                                  |

---

## 🎨 Design System

The UI is built on a custom design token system using CSS custom properties:

| Token Category      | Examples                                    |
|---------------------|---------------------------------------------|
| **Colors**          | `--primary`, `--lost-color`, `--found-color`|
| **Glassmorphism**   | `--glass-bg`, `--glass-border`, `--glass-shine` |
| **Typography**      | Outfit (headings), Plus Jakarta Sans (body) |
| **Radii**           | `--radius-sm` (8px) → `--radius-full` (pill)|
| **Shadows**         | `--shadow-sm`, `--shadow-md`, `--shadow-lg` |
| **Easing**          | `--ease-spring`, `--ease-bounce`, `--ease-smooth` |

All tokens automatically switch between light and dark mode via `[data-theme="dark"]`.

---

## 📬 Contact

- **Name**: Abeluuuuu
- **Email**: [abelgsubi123@gmail.com](mailto:abelgsubi123@gmail.com)
- **Phone**: +91 88489 11609

---

## 📄 License

This project is open source and available for educational and personal use.

---

<p align="center">
  Built with ❤️ by <strong>Abeluuuuu</strong>
</p>
