"use client";

import { useEffect, useSyncExternalStore } from "react";

import { fetchDaySchedule } from "@/lib/api";
import type { DateKey, DaySchedule } from "@/types/schedule";

export type DayState =
  | { status: "loading" }
  | { status: "ready"; data: DaySchedule }
  | { status: "error"; message: string };

const LOADING: DayState = { status: "loading" };

/*
 * One store for every day the page has asked for. Each day is fetched once while
 * the page is open (the backend keeps its own copy fresh, so a reload gets new
 * data); a day that failed is fetched again the next time someone asks for it.
 */
const days = new Map<DateKey, DayState>();
const listeners = new Set<() => void>();
let version = 0;

function update(date: DateKey, state: DayState) {
  days.set(date, state);
  version++;
  listeners.forEach((listener) => listener());
}

/** Start loading `date` unless it is already loading or loaded. */
export function loadDay(date: DateKey): void {
  if (days.get(date)?.status === "loading" || days.get(date)?.status === "ready") return;
  update(date, LOADING);
  fetchDaySchedule(date).then(
    (data) => update(date, { status: "ready", data }),
    (error: unknown) => update(date, { status: "error", message: error instanceof Error ? error.message : String(error) }),
  );
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Loads the given days in parallel and re-renders as each one arrives. */
export function useDaySchedules(dates: DateKey[]) {
  useSyncExternalStore(subscribe, () => version, () => 0);
  const key = dates.join(",");
  useEffect(() => {
    key.split(",").filter(Boolean).forEach(loadDay);
  }, [key]);
  return (date: DateKey): DayState => days.get(date) ?? LOADING;
}
