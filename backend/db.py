import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

_client: MongoClient | None = None


def get_client() -> MongoClient:
    global _client
    if _client is None:
        uri = os.getenv("MONGO_URI")
        if not uri:
            raise RuntimeError("MONGO_URI environment variable is not set")
        _client = MongoClient(uri)
    return _client


def get_db():
    """FastAPI dependency — yields the app database."""
    db_name = os.getenv("MONGO_DB_NAME", "management_app")
    yield get_client()[db_name]
