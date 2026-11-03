import { MINUTES_PER_DAY, absoluteMinutes, type ZonedTime } from "@/lib/dates";
import type { Booking, DateKey, DaySchedule, Grid, Room } from "@/types/schedule";

/**
 * Pure helpers that turn one day's API data into what the views draw.
 * Slots are counted from the start of the official page's day (index 0 = the
 * first slot, e.g. 09:00). Minutes are counted from midnight of that date and
 * go past 1440 for the small hours of the next day.
 */

export type SlotState = "booked" | "free" | "past";

export interface Segment {
  state: SlotState;
  /** first slot index (inclusive) */
  start: number;
  /** last slot index (exclusive) */
  end: number;
  booking?: Booking;
}

export function slotMinutes(grid: Grid, slot: number): number {
  return grid.start_minutes + slot * grid.slot_minutes;
}

/** "HH:MM" on a 24-hour clock. */
export function formatClock(minutes: number): string {
  const m = ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

export function isNextDay(minutes: number): boolean {
  return minutes >= MINUTES_PER_DAY;
}

/** Clock label of a slot boundary, with "隔天" once it is on the next calendar day. */
export function slotLabel(grid: Grid, slot: number): string {
  const minutes = slotMinutes(grid, slot);
  return `${isNextDay(minutes) ? "隔天 " : ""}${formatClock(minutes)}`;
}

/**
 * "14:30–18:00"; "23:30–隔天 06:30" when it runs past midnight; "隔天 00:30–01:30" when
 * it is all on the next day. A range that ends right at midnight ends at "24:00".
 */
export function formatRange(grid: Grid, start: number, end: number): string {
  const from = slotMinutes(grid, start);
  const to = slotMinutes(grid, end);
  const dayOf = (minutes: number) => Math.floor(minutes / MINUTES_PER_DAY);
  const endsAtMidnight = to % MINUTES_PER_DAY === 0 && dayOf(to) === dayOf(from) + 1;
  const endLabel = endsAtMidnight ? "24:00" : formatClock(to);
  const endPrefix = !endsAtMidnight && dayOf(to) > dayOf(from) ? "隔天 " : "";
  return `${slotLabel(grid, start)}–${endPrefix}${endLabel}`;
}

/** 30 → "30 分鐘", 150 → "2.5 小時" */
export function formatDuration(minutes: number): string {
  return minutes < 60 ? `${minutes} 分鐘` : `${Number((minutes / 60).toFixed(2))} 小時`;
}

export function segmentMinutes(grid: Grid, segment: Pick<Segment, "start" | "end">): number {
  return (segment.end - segment.start) * grid.slot_minutes;
}

/**
 * How many slots of `date` have already started at `now` (both on the shop's clock).
 * A slot counts as over as soon as it has started, like the original weekly view.
 */
export function pastSlotCount(date: DateKey, grid: Grid, now: ZonedTime): number {
  const elapsed = absoluteMinutes(now.date, now.minutes) - absoluteMinutes(date, grid.start_minutes);
  return Math.min(grid.slot_count, Math.max(0, Math.ceil(elapsed / grid.slot_minutes)));
}

function clampedBookings(room: Room, grid: Grid): { booking: Booking; start: number; end: number }[] {
  return room.bookings
    .map((booking) => ({
      booking,
      start: Math.max(0, booking.start_slot),
      end: Math.min(grid.slot_count, booking.start_slot + booking.slot_count),
    }))
    .filter((b) => b.end > b.start)
    .sort((a, b) => a.start - b.start);
}

/**
 * Cut one room's day into consecutive segments covering every slot:
 * one segment per booking, and free time split into "past" and "free" at `pastSlots`.
 */
export function roomSegments(room: Room, grid: Grid, pastSlots: number): Segment[] {
  const segments: Segment[] = [];
  const pushGap = (from: number, to: number) => {
    const split = Math.min(Math.max(pastSlots, from), to);
    if (split > from) segments.push({ state: "past", start: from, end: split });
    if (to > split) segments.push({ state: "free", start: split, end: to });
  };
  let cursor = 0;
  for (const { booking, start, end } of clampedBookings(room, grid)) {
    if (start < cursor) continue; // overlapping booking: the official page cannot show this
    pushGap(cursor, start);
    segments.push({ state: "booked", start, end, booking });
    cursor = end;
  }
  pushGap(cursor, grid.slot_count);
  return segments;
}

/** Per slot: is each room free (and not over yet)? rooms × slots */
export function freeMatrix(day: DaySchedule, pastSlots: number): boolean[][] {
  const grid = day.grid;
  if (!grid) return [];
  return day.rooms.map((room) => {
    const free = new Array<boolean>(grid.slot_count).fill(false);
    for (const segment of roomSegments(room, grid, pastSlots)) {
      if (segment.state === "free") free.fill(true, segment.start, segment.end);
    }
    return free;
  });
}

/** Slot index of `minutes` on this grid, or null if no slot starts exactly then. */
export function slotAt(grid: Grid, minutes: number): number | null {
  const offset = minutes - grid.start_minutes;
  if (offset < 0 || offset % grid.slot_minutes !== 0) return null;
  const slot = offset / grid.slot_minutes;
  return slot < grid.slot_count ? slot : null;
}

/** Every slot start (minutes from midnight) used by any of the days, sorted. */
export function unionSlotMinutes(grids: Grid[]): number[] {
  const all = new Set<number>();
  for (const grid of grids) {
    for (let slot = 0; slot < grid.slot_count; slot++) all.add(slotMinutes(grid, slot));
  }
  return [...all].sort((a, b) => a - b);
}

/** Total upcoming free time of one room, in minutes. */
export function freeMinutes(grid: Grid, segments: Segment[]): number {
  return segments.filter((s) => s.state === "free").reduce((sum, s) => sum + segmentMinutes(grid, s), 0);
}

/** The booking that covers `slot` in this room, if any. */
export function bookingAt(room: Room, slot: number): Booking | undefined {
  return room.bookings.find((b) => slot >= b.start_slot && slot < b.start_slot + b.slot_count);
}

/**
 * The slot that contains `now` on this day (started, not yet finished), or null when
 * now is before the day starts or after it ends.
 */
export function currentSlot(date: DateKey, grid: Grid, now: ZonedTime): number | null {
  const elapsed = absoluteMinutes(now.date, now.minutes) - absoluteMinutes(date, grid.start_minutes);
  if (elapsed < 0) return null;
  const slot = Math.floor(elapsed / grid.slot_minutes);
  return slot < grid.slot_count ? slot : null;
}
