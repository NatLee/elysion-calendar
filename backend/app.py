import os
import hashlib
import redis
import json
from concurrent.futures import ThreadPoolExecutor
import logging

from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException
import requests
from fastapi.responses import JSONResponse
from parse_room_schedule import parse_room_schedule

# 初始化 logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
redis_client = redis.Redis.from_url(REDIS_URL)
CACHE_TTL = 60 * 60  # 60 minutes
LOCK_EXPIRE = 60     # 60 seconds, prevent deadlocks

# Create a global thread pool, with a maximum of 30 background tasks
thread_pool = ThreadPoolExecutor(max_workers=30)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RoomStatus:
    def __init__(self, name: str, system: str):
        self.name = name
        self.system = system
        self.reservations = []

def acquire_lock(lock_key):
    lock = redis_client.lock(lock_key, timeout=LOCK_EXPIRE)
    if lock.acquire(blocking=False):
        return lock
    return None

def release_lock(lock):
    if lock:
        try:
            lock.release()
        except redis.exceptions.LockError:
            logging.warning(f"Failed to release lock: {lock.name}")

def update_cache_async(date: str):
    cache_key = f"daily_schedule:{date}"
    sha_key = f"daily_schedule_sha:{date}"
    url = f"http://calendar.elysion.com.tw/bookinfo.aspx?bd={date}"
    lock_key = f"lock:daily_schedule:{date}"
    try:
        if acquire_lock(lock_key):
            try:
                response = requests.get(url)
                html = response.text
                html_sha = hashlib.sha256(html.encode()).hexdigest()
                cached_sha = redis_client.get(sha_key)
                if not cached_sha or cached_sha.decode() != html_sha:
                    rooms = parse_room_schedule(html)
                    result = {
                        "date": date,
                        "rooms": rooms,
                        "url": url,
                    }
                    redis_client.setex(cache_key, CACHE_TTL, json.dumps(result, ensure_ascii=False))
                    redis_client.setex(sha_key, CACHE_TTL, html_sha)
            finally:
                release_lock(lock_key)
    except Exception as e:
        logging.error(f"[update_cache_async] error: {e}", exc_info=True)

@app.get("/api/daily-schedule/{date}")
async def get_daily_schedule(date: str):
    cache_key = f"daily_schedule:{date}"
    sha_key = f"daily_schedule_sha:{date}"
    lock_key = f"lock:daily_schedule:{date}"
    try:
        cached = redis_client.get(cache_key)
        if cached:
            # Background update cache (use thread pool, and add lock)
            thread_pool.submit(update_cache_async, date)
            return json.loads(cached)
        # If no cache, try to get lock
        if acquire_lock(lock_key):
            try:
                url = f"http://calendar.elysion.com.tw/bookinfo.aspx?bd={date}"
                response = requests.get(url)
                html = response.text
                html_sha = hashlib.sha256(html.encode()).hexdigest()
                rooms = parse_room_schedule(html)
                result = {
                    "date": date,
                    "rooms": rooms,
                    "url": url,
                }
                redis_client.setex(cache_key, CACHE_TTL, json.dumps(result, ensure_ascii=False))
                redis_client.setex(sha_key, CACHE_TTL, html_sha)
                return result
            finally:
                release_lock(lock_key)
        else:
            # There are other requests syncing the crawler, return 202 status code to indicate "processing"
            return JSONResponse(content={"detail": "Data is being updated, please try again later"}, status_code=202)
    except Exception as e:
        logging.error(f"[get_daily_schedule] error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)