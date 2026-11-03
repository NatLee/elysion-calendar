import type { DateKey } from "@/types/schedule";

/**
 * Calendar dates are handled as "YYYY-MM-DD" strings and day numbers (days since
 * 1970-01-01), never as local Date objects, so the result does not depend on the
 * viewer's time zone. The only place a real clock comes in is zonedNow().
 */

const DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;
export const MINUTES_PER_DAY = 24 * 60;

export function isDateKey(value: string): value is DateKey {
  const match = DATE_KEY.exec(value);
  if (!match) return false;
  return fromDayNumber(dayNumber(value)) === value;
}

/** Days since 1970-01-01. */
export function dayNumber(key: DateKey): number {
  const match = DATE_KEY.exec(key);
  if (!match) throw new Error(`not a YYYY-MM-DD date: ${key}`);
  const [, y, m, d] = match;
  return Date.UTC(Number(y), Number(m) - 1, Number(d)) / MS_PER_DAY;
}

export function fromDayNumber(days: number): DateKey {
  return new Date(days * MS_PER_DAY).toISOString().slice(0, 10);
}

export function addDays(key: DateKey, days: number): DateKey {
  return fromDayNumber(dayNumber(key) + days);
}

/** 0 = Sunday … 6 = Saturday */
export function weekday(key: DateKey): number {
  return (((dayNumber(key) + 4) % 7) + 7) % 7; // 1970-01-01 was a Thursday
}

export function startOfWeek(key: DateKey, weekStartsOn: number): DateKey {
  return addDays(key, -((weekday(key) - weekStartsOn + 7) % 7));
}

export function weekOf(key: DateKey, weekStartsOn: number): DateKey[] {
  const first = startOfWeek(key, weekStartsOn);
  return Array.from({ length: 7 }, (_, i) => addDays(first, i));
}

/** Wall-clock time somewhere: the date there and the minutes since its midnight. */
export interface ZonedTime {
  date: DateKey;
  minutes: number;
}

export function zonedNow(instant: Date, timeZone: string): ZonedTime {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(instant)
      .map((p) => [p.type, p.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

/** Minutes since 1970-01-01 00:00 of the same wall clock, for comparing two ZonedTimes. */
export function absoluteMinutes(date: DateKey, minutes: number): number {
  return dayNumber(date) * MINUTES_PER_DAY + minutes;
}

/** Weekday names, Sunday first. Written out so labels are the same in every browser. */
const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

interface DateParts {
  y: number;
  m: number;
  d: number;
  /** weekday name, e.g. "六" */
  w: string;
}

const DATE_STYLES = {
  /** 2026年11月7日 星期六 */
  full: ({ y, m, d, w }: DateParts) => `${y}年${m}月${d}日 星期${w}`,
  /** 11月7日 週六 */
  medium: ({ m, d, w }: DateParts) => `${m}月${d}日 週${w}`,
  /** 11/7 */
  monthDay: ({ m, d }: DateParts) => `${m}/${d}`,
  /** 週六 */
  weekday: ({ w }: DateParts) => `週${w}`,
  /** 六 */
  weekdayNarrow: ({ w }: DateParts) => w,
};
export type DateStyle = keyof typeof DATE_STYLES;

export function formatDate(key: DateKey, style: DateStyle): string {
  const [y, m, d] = key.split("-").map(Number);
  return DATE_STYLES[style]({ y, m, d, w: WEEKDAYS[weekday(key)] });
}

/** The day of month as a number, without any locale suffix. */
export function dayOfMonth(key: DateKey): number {
  return Number(key.slice(8, 10));
}

/** DateKey <-> Date at local midnight, only for the date picker widget. */
export function toPickerDate(key: DateKey): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function fromPickerDate(date: Date): DateKey {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
