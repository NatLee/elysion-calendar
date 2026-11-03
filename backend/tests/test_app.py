import json
import re
import threading
import time
from pathlib import Path

import fakeredis
import pytest
import requests
from fastapi.testclient import TestClient

import app as api

PAGE = (Path(__file__).parent / "fixtures" / "bookinfo-2026-11-07.html").read_bytes()


@pytest.fixture
def fetched(monkeypatch):
    """Fake Redis + fake official site; returns the list of URLs that were fetched."""
    calls = []
    monkeypatch.setattr(api, "redis_client", fakeredis.FakeRedis())

    def fake_fetch(url):
        calls.append(url)
        return PAGE

    monkeypatch.setattr(api, "fetch_html", fake_fetch)
    # run background refreshes right away so the tests can see them
    monkeypatch.setattr(api.background, "submit", lambda fn, *args: fn(*args))
    return calls


@pytest.fixture
def client():
    return TestClient(api.app)


def test_first_request_for_a_day_succeeds(fetched, client):
    # Regression: the first (uncached) request used to answer HTTP 500 because the lock
    # was released with its key instead of the lock object.
    response = client.get("/api/daily-schedule/2026-11-07")
    assert response.status_code == 200
    body = response.json()
    assert body["date"] == "2026-11-07"
    assert body["url"] == f"{api.SOURCE_URL}?bd=2026-11-07"
    assert body["grid"] == {"start_minutes": 540, "slot_minutes": 30, "slot_count": 48}
    assert [room["name"] for room in body["rooms"]] == ["A包廂 -MAX", "B包廂 - MAX GO", "C包廂 - XG8000R"]
    assert fetched == [f"{api.SOURCE_URL}?bd=2026-11-07"]
    assert response.headers["cache-control"] == f"public, max-age={api.REFRESH_AFTER}"


def test_fresh_cache_is_served_without_touching_the_site(fetched, client):
    client.get("/api/daily-schedule/2026-11-07")
    client.get("/api/daily-schedule/2026-11-07")
    assert len(fetched) == 1


def test_stale_cache_is_served_and_refreshed_in_the_background(fetched, client):
    client.get("/api/daily-schedule/2026-11-07")
    key = api._cache_key(api.date(2026, 11, 7))
    entry = json.loads(api.redis_client.get(key))
    entry["fetched_at"] -= api.REFRESH_AFTER + 1
    entry["data"]["rooms"] = []  # mark the old copy so we can tell which one we got
    api.redis_client.set(key, json.dumps(entry))

    response = client.get("/api/daily-schedule/2026-11-07")
    assert response.json()["rooms"] == []  # the stale copy, answered right away
    assert response.headers["cache-control"] == "public, max-age=0"
    assert len(fetched) == 2  # and a refresh happened
    assert len(client.get("/api/daily-schedule/2026-11-07").json()["rooms"]) == 3


def test_failed_background_refresh_keeps_the_cached_copy(fetched, client, monkeypatch):
    client.get("/api/daily-schedule/2026-11-07")
    key = api._cache_key(api.date(2026, 11, 7))
    entry = json.loads(api.redis_client.get(key))
    entry["fetched_at"] -= api.REFRESH_AFTER + 1
    api.redis_client.set(key, json.dumps(entry))

    def offline(url):
        raise requests.ConnectionError("offline")

    monkeypatch.setattr(api, "fetch_html", offline)
    response = client.get("/api/daily-schedule/2026-11-07")
    assert response.status_code == 200
    assert len(response.json()["rooms"]) == 3


def test_invalid_date_is_rejected_before_reaching_the_site(fetched, client):
    for bad in ["garbage", "2026-13-01", "2026-11-07&x=1"]:
        assert client.get(f"/api/daily-schedule/{bad}").status_code == 422
    assert fetched == []


def test_site_down_is_a_502(fetched, client, monkeypatch):
    def offline(url):
        raise requests.ConnectionError("offline")

    monkeypatch.setattr(api, "fetch_html", offline)
    response = client.get("/api/daily-schedule/2026-11-07")
    assert response.status_code == 502


def test_changed_page_layout_is_a_502(fetched, client, monkeypatch):
    broken = re.sub(rb"<td>\d+</td>", b"<td>?</td>", PAGE)  # hour labels gone
    monkeypatch.setattr(api, "fetch_html", lambda url: broken)
    assert client.get("/api/daily-schedule/2026-11-07").status_code == 502


def test_waiting_request_reuses_what_the_lock_holder_fetched(fetched):
    # Two requests for the same uncached day: the second waits for the first instead of
    # answering 202 (old behaviour) or fetching the site a second time.
    day = api.date(2026, 11, 7)
    holding = threading.Event()

    def first_request():
        lock = api._lock(day)
        assert lock.acquire(blocking=False)
        holding.set()
        time.sleep(0.3)
        api.fetch_and_store(day)
        lock.release()

    thread = threading.Thread(target=first_request)
    thread.start()
    holding.wait()
    entry = api.load_day(day)
    thread.join()
    assert entry["data"]["date"] == "2026-11-07"
    assert len(fetched) == 1
