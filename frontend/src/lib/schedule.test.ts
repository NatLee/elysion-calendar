import { describe, expect, it } from "vitest";

import {
  bookingAt,
  currentSlot,
  formatClock,
  formatDuration,
  formatRange,
  freeMatrix,
  freeMinutes,
  pastSlotCount,
  roomSegments,
  slotAt,
  slotLabel,
  unionSlotMinutes,
} from "@/lib/schedule";
import type { Booking, DaySchedule, Grid, Room } from "@/types/schedule";

// The official page: 48 half-hour slots from 09:00 to 09:00 the next morning.
const GRID: Grid = { start_minutes: 9 * 60, slot_minutes: 30, slot_count: 48 };

function booking(start_slot: number, slot_count: number, customer = "王先生"): Booking {
  return { customer, start_time: "", end_time: "", duration: "", start_slot, slot_count };
}

function room(id: number, bookings: Booking[]): Room {
  return { id, name: `${"ABC"[id]}包廂`, system: "DAM", bookings };
}

const DAY: DaySchedule = {
  date: "2026-11-07",
  url: "https://example.test/bookinfo.aspx?bd=2026-11-07",
  grid: GRID,
  rooms: [
    room(0, [booking(0, 6), booking(29, 14, "夜貓團")]), // 09:00–12:00, 23:30–06:30
    room(1, []),
  ],
};

describe("clock labels", () => {
  it("wraps at midnight and marks the next day", () => {
    expect(formatClock(9 * 60)).toBe("09:00");
    expect(formatClock(24 * 60 + 30)).toBe("00:30");
    expect(slotLabel(GRID, 0)).toBe("09:00");
    expect(slotLabel(GRID, 29)).toBe("23:30");
    expect(slotLabel(GRID, 30)).toBe("隔天 00:00");
    expect(slotLabel(GRID, 48)).toBe("隔天 09:00");
    expect(formatRange(GRID, 29, 43)).toBe("23:30–隔天 06:30");
    expect(formatRange(GRID, 31, 33)).toBe("隔天 00:30–01:30");
    expect(formatRange(GRID, 22, 30)).toBe("20:00–24:00");
    expect(formatRange(GRID, 0, 6)).toBe("09:00–12:00");
    expect(formatRange(GRID, 45, 48)).toBe("隔天 07:30–09:00");
  });

  it("describes durations", () => {
    expect(formatDuration(30)).toBe("30 分鐘");
    expect(formatDuration(60)).toBe("1 小時");
    expect(formatDuration(150)).toBe("2.5 小時");
  });
});

describe("pastSlotCount", () => {
  const at = (date: string, h: number, m = 0) => ({ date, minutes: h * 60 + m });

  it("is 0 before the day starts and all slots once it is over", () => {
    expect(pastSlotCount("2026-11-07", GRID, at("2026-11-07", 8, 59))).toBe(0);
    expect(pastSlotCount("2026-11-07", GRID, at("2026-11-07", 9, 0))).toBe(0);
    expect(pastSlotCount("2026-11-07", GRID, at("2026-11-09", 12))).toBe(48);
    expect(pastSlotCount("2026-11-08", GRID, at("2026-11-07", 14))).toBe(0);
  });

  it("counts a slot as over as soon as it has started", () => {
    expect(pastSlotCount("2026-11-07", GRID, at("2026-11-07", 9, 1))).toBe(1);
    expect(pastSlotCount("2026-11-07", GRID, at("2026-11-07", 14, 20))).toBe(11); // 14:00 has started
    expect(pastSlotCount("2026-11-07", GRID, at("2026-11-07", 14, 30))).toBe(11);
  });

  it("follows the day into the next morning", () => {
    // 02:10 on Sunday is still Saturday's page
    expect(pastSlotCount("2026-11-07", GRID, at("2026-11-08", 2, 10))).toBe(35);
  });
});

describe("roomSegments", () => {
  it("covers every slot with bookings, past and free time", () => {
    const segments = roomSegments(DAY.rooms[0], GRID, 11);
    expect(segments.map(({ state, start, end }) => [state, start, end])).toEqual([
      ["booked", 0, 6],
      ["past", 6, 11],
      ["free", 11, 29],
      ["booked", 29, 43],
      ["free", 43, 48],
    ]);
    expect(segments[3].booking?.customer).toBe("夜貓團");
  });

  it("handles an empty room, a day that is over and one that has not started", () => {
    expect(roomSegments(DAY.rooms[1], GRID, 0)).toEqual([{ state: "free", start: 0, end: 48 }]);
    expect(roomSegments(DAY.rooms[1], GRID, 48)).toEqual([{ state: "past", start: 0, end: 48 }]);
  });

  it("keeps booked slots booked even after they are over", () => {
    expect(roomSegments(DAY.rooms[0], GRID, 48).map((s) => s.state)).toEqual(["booked", "past", "booked", "past"]);
  });

  it("clamps bookings outside the grid and skips overlaps", () => {
    const odd = room(0, [booking(44, 10), booking(2, 4), booking(3, 2)]);
    expect(roomSegments(odd, GRID, 0).map(({ state, start, end }) => [state, start, end])).toEqual([
      ["free", 0, 2],
      ["booked", 2, 6],
      ["free", 6, 44],
      ["booked", 44, 48],
    ]);
  });

  it("adds up the free time", () => {
    expect(freeMinutes(GRID, roomSegments(DAY.rooms[0], GRID, 11))).toBe((18 + 5) * 30);
  });
});

describe("freeMatrix", () => {
  it("marks free, not-yet-over slots per room", () => {
    const matrix = freeMatrix(DAY, 11);
    expect(matrix).toHaveLength(2);
    expect(matrix[0].slice(0, 12)).toEqual([false, false, false, false, false, false, false, false, false, false, false, true]);
    expect(matrix[0][30]).toBe(false); // night booking
    expect(matrix[1].filter(Boolean)).toHaveLength(48 - 11);
  });

  it("is empty for a day without data", () => {
    expect(freeMatrix({ ...DAY, grid: null, rooms: [] }, 0)).toEqual([]);
  });
});

describe("aligning days in the weekly overview", () => {
  it("finds the slot that starts at a given minute", () => {
    expect(slotAt(GRID, 9 * 60)).toBe(0);
    expect(slotAt(GRID, 24 * 60)).toBe(30);
    expect(slotAt(GRID, 9 * 60 + 15)).toBeNull();
    expect(slotAt(GRID, 8 * 60)).toBeNull();
    expect(slotAt(GRID, 33 * 60)).toBeNull(); // 09:00 the next morning is the next page
  });

  it("merges the rows of days that use different grids", () => {
    const hourly: Grid = { start_minutes: 10 * 60, slot_minutes: 60, slot_count: 2 };
    const short: Grid = { start_minutes: 9 * 60, slot_minutes: 30, slot_count: 3 };
    expect(unionSlotMinutes([short, hourly])).toEqual([540, 570, 600, 660]);
  });
});

describe("what is happening right now", () => {
  const at = (date: string, h: number, m = 0) => ({ date, minutes: h * 60 + m });

  it("finds the slot that contains now", () => {
    expect(currentSlot("2026-11-07", GRID, at("2026-11-07", 8, 59))).toBeNull();
    expect(currentSlot("2026-11-07", GRID, at("2026-11-07", 9, 0))).toBe(0);
    expect(currentSlot("2026-11-07", GRID, at("2026-11-07", 14, 20))).toBe(10);
    expect(currentSlot("2026-11-07", GRID, at("2026-11-08", 8, 59))).toBe(47);
    expect(currentSlot("2026-11-07", GRID, at("2026-11-08", 9, 0))).toBeNull();
  });

  it("finds the booking that covers a slot", () => {
    expect(bookingAt(DAY.rooms[0], 5)?.customer).toBe("王先生");
    expect(bookingAt(DAY.rooms[0], 6)).toBeUndefined();
    expect(bookingAt(DAY.rooms[0], 42)?.customer).toBe("夜貓團");
    expect(bookingAt(DAY.rooms[1], 0)).toBeUndefined();
  });
});
