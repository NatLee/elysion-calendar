import { RotateCw } from "lucide-react";

import { buttonClass } from "@/components/ui";
import { dayNumber, formatDate } from "@/lib/dates";
import type { DayState } from "@/hooks/useDaySchedules";
import type { DateKey, DaySchedule, Grid } from "@/types/schedule";

/** A day that has data to draw. */
export interface ReadyDay {
  day: DaySchedule;
  grid: Grid;
}

export function readyDay(state: DayState): ReadyDay | null {
  if (state.status !== "ready" || !state.data.grid || state.data.rooms.length === 0) return null;
  return { day: state.data, grid: state.data.grid };
}

interface Props {
  date: DateKey;
  today: DateKey;
  state: DayState;
  onRetry: () => void;
}

/** What to show instead of a day's views while it loads, when it failed, or when it has no data. */
export function DayStatus({ date, today, state, onRetry }: Props) {
  if (state.status === "loading") {
    return (
      <div role="status" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <span className="sr-only">正在讀取 {formatDate(date, "medium")} 的預約…</span>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} aria-hidden className="h-40 animate-pulse rounded-lg border bg-card" />
        ))}
      </div>
    );
  }
  if (state.status === "error") {
    return (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-lg border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">{formatDate(date, "medium")} 的預約讀不到</p>
          <p className="text-sm text-muted-foreground">{state.message}</p>
        </div>
        <button type="button" className={buttonClass("primary")} onClick={onRetry}>
          <RotateCw aria-hidden className="size-4" />
          再試一次
        </button>
      </div>
    );
  }
  const over = dayNumber(date) < dayNumber(today);
  return (
    <div className="rounded-lg border bg-card p-6">
      <p className="font-semibold">{formatDate(date, "medium")} 沒有可以顯示的預約</p>
      <p className="text-sm text-muted-foreground">
        {over ? "這天已經過了，官網不提供過去的預約資料。" : "官網這天沒有列出任何包廂。"}
      </p>
    </div>
  );
}
