"use client";

import { useSyncExternalStore } from "react";

import { SCHEDULE } from "@/config/site";
import { zonedNow, type ZonedTime } from "@/lib/dates";

/*
 * The shop's wall clock, updated every SCHEDULE.clockTickMs. On the server (and in
 * the first client render) it is null, so nothing that depends on "today" is
 * rendered until the browser knows the time -- no hydration mismatch.
 */
let current: ZonedTime | null = null;
let currentKey = "";

function read(): ZonedTime {
  const next = zonedNow(new Date(), SCHEDULE.timeZone);
  const key = `${next.date} ${next.minutes}`;
  if (key !== currentKey) {
    current = next;
    currentKey = key;
  }
  return current!;
}

function subscribe(onChange: () => void) {
  const timer = setInterval(onChange, SCHEDULE.clockTickMs);
  return () => clearInterval(timer);
}

export function useShopClock(): ZonedTime | null {
  return useSyncExternalStore(subscribe, read, () => null);
}
