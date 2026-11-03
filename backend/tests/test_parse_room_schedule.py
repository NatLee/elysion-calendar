import re
from pathlib import Path

import pytest

from parse_room_schedule import (
    ScheduleFormatError,
    clean_customer,
    clock,
    describe_duration,
    parse_schedule_page,
)

FIXTURES = Path(__file__).parent / "fixtures"


@pytest.fixture(scope="module")
def page():
    return parse_schedule_page((FIXTURES / "bookinfo-2026-11-07.html").read_bytes())


def bookings_of(page, room_index):
    return [(b["start_time"], b["end_time"], b["duration"]) for b in page["rooms"][room_index]["bookings"]]


def test_grid_is_read_from_the_hour_labels(page):
    assert page["grid"] == {"start_minutes": 9 * 60, "slot_minutes": 30, "slot_count": 48}


def test_rooms_keep_name_order_and_karaoke_system(page):
    assert [(r["id"], r["name"], r["system"]) for r in page["rooms"]] == [
        (0, "A包廂 -MAX", "JOYSOUND"),
        (1, "B包廂 - MAX GO", "JOYSOUND"),
        (2, "C包廂 - XG8000R", "DAM"),
    ]


def test_booking_times_and_slots(page):
    first = page["rooms"][0]["bookings"][0]
    assert first == {
        "customer": "王先生",
        "start_time": "09:00",
        "end_time": "12:00",
        "duration": "3小時",
        "start_slot": 0,
        "slot_count": 6,
    }
    assert page["rooms"][1]["bookings"] == []


def test_half_hours_are_not_rounded_away(page):
    # was "2小時" before the fix
    assert bookings_of(page, 0)[1] == ("13:00", "15:30", "2.5小時")
    assert bookings_of(page, 2)[2] == ("08:30", "09:00", "30分鐘")


def test_bookings_past_midnight_use_a_24_hour_clock(page):
    # was "30:30" and "24:30" before the fix
    assert bookings_of(page, 0)[2] == ("23:30", "06:30", "7小時")
    assert bookings_of(page, 2)[0] == ("21:30", "00:30", "3小時")
    assert bookings_of(page, 2)[1] == ("01:30", "02:30", "1小時")


def test_duration_suffix_is_stripped_with_or_without_a_space(page):
    names = [b["customer"] for room in page["rooms"] for b in room["bookings"]]
    assert names == ["王先生", "弓長", "(訂)只是想唱歌", "陳小姐", "王 (小王)", "Kevin"]


def test_expired_page_has_no_rooms_and_no_grid():
    page = parse_schedule_page((FIXTURES / "bookinfo-expired.html").read_text(encoding="utf-8"))
    assert page == {"grid": None, "rooms": []}


def test_grid_follows_the_labels_even_if_they_start_later():
    html = (FIXTURES / "bookinfo-2026-11-07.html").read_text(encoding="utf-8")
    shifted = html.replace("<td>9</td>", "<td>&nbsp</td>")  # first label now "10" at index 2
    assert parse_schedule_page(shifted)["grid"]["start_minutes"] == 9 * 60


def test_unknown_table_layout_is_an_error_not_wrong_data():
    html = (FIXTURES / "bookinfo-2026-11-07.html").read_text(encoding="utf-8")
    broken = re.sub(r"<td>\d+</td>", "<td>?</td>", html)  # hour labels gone
    with pytest.raises(ScheduleFormatError):
        parse_schedule_page(broken)


@pytest.mark.parametrize(
    "minutes, expected",
    [(0, "00:00"), (9 * 60 + 30, "09:30"), (24 * 60, "00:00"), (30 * 60 + 30, "06:30")],
)
def test_clock_wraps_at_midnight(minutes, expected):
    assert clock(minutes) == expected


@pytest.mark.parametrize("minutes, expected", [(30, "30分鐘"), (60, "1小時"), (150, "2.5小時"), (420, "7小時")])
def test_describe_duration(minutes, expected):
    assert describe_duration(minutes) == expected


@pytest.mark.parametrize(
    "text, expected",
    [(" 好久沒來(4H) ", "好久沒來"), ("(訂)林 (8H)", "(訂)林"), ("弓長(2.5h)", "弓長"), ("王 (小王)", "王 (小王)")],
)
def test_clean_customer(text, expected):
    assert clean_customer(text) == expected
