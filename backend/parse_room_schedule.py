"""Turn one day of the Elysion booking page (bookinfo.aspx) into plain data.

The page has one table per room. The first row holds the bookings (a booked
cell has a background colour and spans several slots); the second row holds
the hour labels ("9", "&nbsp", "10", ...). Everything about the time grid --
when the day starts, how long a slot is, how many slots there are -- is read
from that label row, so nothing here assumes "9 o'clock" or "30 minutes".
"""

from __future__ import annotations

import re
from typing import Optional, TypedDict

from bs4 import BeautifulSoup, Tag

MINUTES_PER_DAY = 24 * 60

# "(4H)", " (2.5H)" at the end of a booking name is the booked length, which we already know.
DURATION_SUFFIX = re.compile(r"\s*\(\s*\d+(?:\.\d+)?\s*H\s*\)\s*$", re.IGNORECASE)


class ScheduleFormatError(ValueError):
    """The page no longer looks like the booking page we know how to read."""


class Grid(TypedDict):
    start_minutes: int  # minutes after midnight of the day the first slot starts
    slot_minutes: int
    slot_count: int


class Booking(TypedDict):
    customer: str
    start_time: str  # "HH:MM" on a 24-hour clock; may belong to the next day
    end_time: str
    duration: str  # human readable, e.g. "3小時", "2.5小時", "30分鐘"
    start_slot: int  # index of the first slot, 0-based
    slot_count: int


class Room(TypedDict):
    id: int
    name: str
    system: Optional[str]  # karaoke system, e.g. "JOYSOUND" or "DAM"
    bookings: list[Booking]


class DayPage(TypedDict):
    grid: Optional[Grid]  # None when the page has no rooms (e.g. a past date)
    rooms: list[Room]


def clock(minutes: int) -> str:
    """Minutes after midnight (may be past 24:00) -> "HH:MM" on a 24-hour clock."""
    minutes %= MINUTES_PER_DAY
    return f"{minutes // 60:02d}:{minutes % 60:02d}"


def describe_duration(minutes: int) -> str:
    if minutes < 60:
        return f"{minutes}分鐘"
    return f"{minutes / 60:g}小時"


def clean_customer(text: str) -> str:
    return DURATION_SUFFIX.sub("", text.strip())


def _colspan(cell: Tag) -> int:
    try:
        return max(1, int(cell.get("colspan", 1)))
    except (TypeError, ValueError):
        return 1


def parse_grid(label_row: Tag) -> Grid:
    labels = [cell.get_text(strip=True) for cell in label_row.find_all("td")]
    hours = [(index, int(text)) for index, text in enumerate(labels) if text.isdigit()]
    if len(hours) < 2:
        raise ScheduleFormatError("cannot find the hour labels under the booking table")
    (first_index, first_hour), (second_index, second_hour) = hours[0], hours[1]
    hour_step = (second_hour - first_hour) % 24
    slot_minutes, remainder = divmod(hour_step * 60, second_index - first_index)
    if slot_minutes <= 0 or remainder:
        raise ScheduleFormatError(f"unexpected hour labels: {labels[:6]}")
    return {
        "start_minutes": (first_hour % 24) * 60 - first_index * slot_minutes,
        "slot_minutes": slot_minutes,
        "slot_count": len(labels),
    }


def parse_bookings(booking_row: Tag, grid: Grid) -> list[Booking]:
    bookings: list[Booking] = []
    slot = 0
    for cell in booking_row.find_all("td"):
        span = _colspan(cell)
        if "background" in (cell.get("style") or ""):
            start = grid["start_minutes"] + slot * grid["slot_minutes"]
            length = span * grid["slot_minutes"]
            bookings.append({
                "customer": clean_customer(cell.get_text()),
                "start_time": clock(start),
                "end_time": clock(start + length),
                "duration": describe_duration(length),
                "start_slot": slot,
                "slot_count": span,
            })
        slot += span
    return bookings


def _system(room_div: Tag) -> Optional[str]:
    header = room_div.find("div", class_="book-number")
    spans = header.find_all("span") if header else []
    if len(spans) < 2:
        return None
    return spans[1].get_text(strip=True).strip("()（） ") or None


def parse_schedule_page(html: str | bytes) -> DayPage:
    soup = BeautifulSoup(html, "html.parser")
    grid: Optional[Grid] = None
    rooms: list[Room] = []
    for index, room_div in enumerate(soup.find_all("div", class_="book-room col-xs-12")):
        name_tag = room_div.find("span", class_="book-number-en")
        if not name_tag:
            continue
        table = room_div.find("table")
        rows = table.find_all("tr") if table else []
        if len(rows) < 2:
            raise ScheduleFormatError(f"room {name_tag.get_text(strip=True)!r} has no booking table")
        room_grid = parse_grid(rows[1])
        if grid and room_grid != grid:
            raise ScheduleFormatError("rooms use different time grids")
        grid = room_grid
        rooms.append({
            "id": index,
            "name": name_tag.get_text(strip=True),
            "system": _system(room_div),
            "bookings": parse_bookings(rows[0], room_grid),
        })
    return {"grid": grid, "rooms": rooms}
