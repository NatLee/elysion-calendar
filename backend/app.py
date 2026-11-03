"""Small API in front of the Elysion booking page, with a Redis cache.

GET /api/daily-schedule/{YYYY-MM-DD} returns that day's rooms and bookings.

Caching: a day is fetched from the official site once and kept in Redis for
CACHE_TTL seconds. Once an entry is older than REFRESH_AFTER seconds, the next
request still gets the cached copy right away and a background job fetches a
fresh one. A per-day lock makes sure only one request talks to the site for a
given day; others wait for it instead of fetching again.
"""

from __future__ import annotations

import json
import logging
import math
import os
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from typing import Any, Optional

import redis
import requests
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware

from parse_room_schedule import ScheduleFormatError, parse_schedule_page

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("elysion")

SOURCE_URL = os.getenv("SOURCE_URL", "https://calendar.elysion.com.tw/bookinfo.aspx")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
CACHE_TTL = 60 * 60  # seconds an entry is kept at all
REFRESH_AFTER = 5 * 60  # seconds before an entry is refreshed in the background
FETCH_TIMEOUT = 15  # seconds for one request to the official site
LOCK_TIMEOUT = FETCH_TIMEOUT * 2  # a crashed holder can block a day at most this long
CACHE_VERSION = 2  # bump when the cached JSON shape changes, so old entries are ignored

redis_client = redis.Redis.from_url(REDIS_URL)
background = ThreadPoolExecutor(max_workers=4)

app = FastAPI(title="Elysion Calendar API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def source_url(day: date) -> str:
    return f"{SOURCE_URL}?bd={day.isoformat()}"


def fetch_html(url: str) -> bytes:
    response = requests.get(url, timeout=FETCH_TIMEOUT)
    response.raise_for_status()
    return response.content  # bytes: BeautifulSoup reads the charset from the page itself


def _cache_key(day: date) -> str:
    return f"daily_schedule:v{CACHE_VERSION}:{day.isoformat()}"


def _lock(day: date):
    return redis_client.lock(f"lock:{_cache_key(day)}", timeout=LOCK_TIMEOUT)


def _release(lock) -> None:
    try:
        lock.release()
    except redis.exceptions.LockError:
        log.warning("lock %s expired before it was released", lock.name)


def read_cache(day: date) -> Optional[dict[str, Any]]:
    raw = redis_client.get(_cache_key(day))
    return json.loads(raw) if raw else None


def fetch_and_store(day: date) -> dict[str, Any]:
    """Fetch one day from the official site and cache it. Call with the day's lock held."""
    url = source_url(day)
    entry = {
        "fetched_at": time.time(),
        "data": {"date": day.isoformat(), "url": url, **parse_schedule_page(fetch_html(url))},
    }
    redis_client.set(_cache_key(day), json.dumps(entry, ensure_ascii=False), ex=CACHE_TTL)
    return entry


def refresh_in_background(day: date) -> None:
    lock = _lock(day)
    if not lock.acquire(blocking=False):
        return  # someone else is already fetching this day
    try:
        fetch_and_store(day)
    except Exception:
        log.exception("background refresh of %s failed; keeping the cached copy", day)
    finally:
        _release(lock)


def load_day(day: date) -> dict[str, Any]:
    entry = read_cache(day)
    if entry is not None:
        if time.time() - entry["fetched_at"] > REFRESH_AFTER:
            background.submit(refresh_in_background, day)
        return entry
    lock = _lock(day)
    if not lock.acquire(blocking=True, blocking_timeout=LOCK_TIMEOUT):
        raise HTTPException(503, "The official site is slow right now, please try again.")
    try:
        # Another request may have filled the cache while we were waiting for the lock.
        return read_cache(day) or fetch_and_store(day)
    finally:
        _release(lock)


@app.get("/api/daily-schedule/{day}")
def get_daily_schedule(day: date, response: Response) -> dict[str, Any]:
    try:
        entry = load_day(day)
    except requests.RequestException as error:
        log.warning("fetching %s failed: %s", day, error)
        raise HTTPException(502, "Could not reach the official booking site.") from error
    except ScheduleFormatError as error:
        log.error("the booking page for %s changed: %s", day, error)
        raise HTTPException(502, "The official booking page changed and cannot be read.") from error
    fresh_for = max(0, math.ceil(REFRESH_AFTER - (time.time() - entry["fetched_at"])))
    response.headers["Cache-Control"] = f"public, max-age={fresh_for}"
    return entry["data"]


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
