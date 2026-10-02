import os
import sys

# Add root project directory to sys.path so app and database can be imported
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from app import app

# Vercel serverless entrypoint
# The 'app' object will be called for all incoming requests routed to /api/index.py
