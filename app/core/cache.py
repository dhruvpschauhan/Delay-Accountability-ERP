import json
import redis
from app.core.config import settings

# We only initialize Redis if the URL is provided in the .env file.
# This makes it completely optional, so it won't crash on Hugging Face Spaces!
redis_client = None

if settings.REDIS_URL:
    try:
        redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
        redis_client.ping() # Test the connection
        print("✅ Redis connected successfully!")
    except Exception as e:
        print(f"⚠️ Redis connection failed (running without cache): {e}")
        redis_client = None

def get_cache(key: str):
    if not redis_client:
        return None
    try:
        data = redis_client.get(key)
        if data:
            return json.loads(data)
    except Exception:
        return None

def set_cache(key: str, data: list | dict, expire_seconds: int = 300):
    if not redis_client:
        return
    try:
        redis_client.setex(key, expire_seconds, json.dumps(data))
    except Exception:
        pass

def invalidate_cache(pattern: str):
    """Deletes keys matching a pattern, e.g., 'invoices:*'"""
    if not redis_client:
        return
    try:
        keys = redis_client.keys(pattern)
        if keys:
            redis_client.delete(*keys)
    except Exception:
        pass
