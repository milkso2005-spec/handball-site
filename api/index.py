import sys
import os

# Add the backend directory to sys.path so that
# `import models`, `import schemas`, etc. work correctly on Vercel
backend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
sys.path.insert(0, backend_dir)

# Load .env from the backend directory
from dotenv import load_dotenv
env_path = os.path.join(backend_dir, ".env")
if os.path.exists(env_path):
    load_dotenv(env_path)

from backend.main import app
