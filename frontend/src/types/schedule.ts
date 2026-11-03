/** A calendar date as "YYYY-MM-DD", the same format the API uses. */
export type DateKey = string;

/** How the official page cuts a day into slots, e.g. 48 slots of 30 minutes from 09:00. */
export interface Grid {
  /** Minutes after midnight of the day when the first slot starts. */
  start_minutes: number;
  slot_minutes: number;
  slot_count: number;
}

export interface Booking {
  customer: string;
  /** "HH:MM" on a 24-hour clock; can be on the next day (see start_slot). */
  start_time: string;
  end_time: string;
  /** Human readable length from the backend, e.g. "3小時". */
  duration: string;
  start_slot: number;
  slot_count: number;
}

export interface Room {
  id: number;
  name: string;
  /** Karaoke system, e.g. "JOYSOUND" or "DAM". */
  system: string | null;
  bookings: Booking[];
}

/** GET /api/daily-schedule/{date} */
export interface DaySchedule {
  date: DateKey;
  /** The official page this was read from. */
  url: string;
  /** null when the official site has nothing for that day (e.g. it is already over). */
  grid: Grid | null;
  rooms: Room[];
}
