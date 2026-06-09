import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    return psycopg2.connect(
        host=os.getenv("FX_DB_HOST", "localhost"),
        port=os.getenv("FX_DB_PORT", "5437"),
        database=os.getenv("FX_DB_NAME", "fx"),
        user=os.getenv("FX_DB_USER", "fx"),
        password=os.getenv("FX_DB_PASSWORD", "admin"),
    )