"use client";

import { RotateCw } from "lucide-react";

import { readyDay, type ReadyDay } from "@/components/DayStatus";
import { STATE_STYLE } from "@/components/ui";
import type { DayState } from "@/hooks/useDaySchedules";
import { useScrollToRow } from "@/hooks/useScrollToRow";
import { dayNumber, formatDate, type ZonedTime } from "@/lib/dates";
import { currentSlot, formatClock, freeMatrix, isNextDay, pastSlotCount, slotAt, unionSlotMinutes } from "@/lib/schedule";
import { cn } from "@/lib/utils";
import type { DateKey } from "@/types/schedule";

interface Props {
  week: DateKey[];
  today: DateKey;
  now: ZonedTime;
  stateOf: (date: DateKey) => DayState;
  onRetry: (date: DateKey) => void;
  onOpenDay: (date: DateKey) => void;
}

interface Column {
  date: DateKey;
  ready: (ReadyDay & { pastSlots: number; free: boolean[][] }) | null;
  state: DayState;
}

/** The whole week at a glance: for every slot of every day, how many rooms are still free. */
export function WeekOverview({ week, today, now, stateOf, onRetry, onOpenDay }: Props) {
  const columns: Column[] = week.map((date) => {
    const state = stateOf(date);
    const ready = readyDay(state);
    if (!ready) return { date, state, ready: null };
    const pastSlots = pastSlotCount(date, ready.grid, now);
    return { date, state, ready: { ...ready, pastSlots, free: freeMatrix(ready.day, pastSlots) } };
  });
  const grids = columns.flatMap((c) => (c.ready ? [c.ready.grid] : []));
  const rows = unionSlotMinutes(grids);

  const todayColumn = columns.find((c) => c.date === today)?.ready;
  const nowSlot = todayColumn ? currentSlot(today, todayColumn.grid, now) : null;
  const focusRow = nowSlot === null || !todayColumn ? null : rows.indexOf(todayColumn.grid.start_minutes + nowSlot * todayColumn.grid.slot_minutes);
  const { scroller, row } = useScrollToRow(focusRow, week[0]);

  if (rows.length === 0) {
    const loading = columns.some((c) => c.state.status === "loading");
    return (
      <p role={loading ? "status" : undefined} className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
        {loading ? "正在讀取這一週的預約…" : "這一週沒有可以顯示的預約。"}
      </p>
    );
  }

  return (
    <div
      ref={scroller}
      tabIndex={0}
      role="region"
      aria-label={`${formatDate(week[0], "medium")} 起一週的總覽，可以捲動`}
      className="relative max-h-[70vh] overflow-auto rounded-lg border bg-card"
    >
      <table className="w-full table-fixed border-separate border-spacing-0 text-xs sm:text-sm">
        <caption className="sr-only">每個時段還有幾間包廂可以預約；點日期可以看當天的時間表格</caption>
        <colgroup>
          <col className="w-11 sm:w-24" />
          {week.map((date) => (
            <col key={date} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className="sticky left-0 top-0 z-30 border-b border-r bg-card px-1 py-2 text-left font-semibold">
              時間
            </th>
            {columns.map(({ date }) => (
              <th key={date} scope="col" className="sticky top-0 z-20 border-b bg-card p-1 font-semibold">
                <button
                  type="button"
                  onClick={() => onOpenDay(date)}
                  className={cn(
                    "flex w-full flex-col items-center rounded-md py-1 leading-tight hover:bg-muted",
                    date === today && "text-primary",
                  )}
                >
                  <span>{formatDate(date, "weekday")}</span>
                  <span className="tabular-nums">{formatDate(date, "monthDay")}</span>
                  <span className="sr-only">，看這天的時間表格</span>
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((minutes, index) => {
            const firstOfNextDay = isNextDay(minutes) && (index === 0 || !isNextDay(rows[index - 1]));
            return (
              <tr key={minutes} ref={index === focusRow ? row : undefined} className="h-7">
                <th
                  scope="row"
                  className={cn(
                    "sticky left-0 z-10 border-r bg-card px-1 text-left align-top font-normal tabular-nums",
                    minutes % 60 === 0 ? "text-foreground" : "text-muted-foreground",
                    firstOfNextDay && "border-t-2 border-t-foreground/40",
                  )}
                >
                  {formatClock(minutes)}
                  {firstOfNextDay && <span className="block text-[11px] font-semibold">隔天</span>}
                </th>
                {columns.map((column) =>
                  column.ready ? (
                    <CountCell key={column.date} column={column.ready} minutes={minutes} nextDayLine={firstOfNextDay} />
                  ) : index === 0 ? (
                    <MissingDay key={column.date} column={column} today={today} rows={rows.length} onRetry={onRetry} />
                  ) : null,
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CountCell({ column, minutes, nextDayLine }: { column: NonNullable<Column["ready"]>; minutes: number; nextDayLine: boolean }) {
  const slot = slotAt(column.grid, minutes);
  const base = cn("border-b border-l border-l-card px-1 text-center align-middle tabular-nums", nextDayLine && "border-t-2 border-t-foreground/40");
  if (slot === null) return <td className={cn(base, "bg-muted")} />;
  if (slot < column.pastSlots) {
    return (
      <td className={cn(base, STATE_STYLE.past.cell)}>
        <span aria-hidden>·</span>
        <span className="sr-only">{STATE_STYLE.past.label}</span>
      </td>
    );
  }
  const freeRooms = column.day.rooms.filter((_, i) => column.free[i][slot]);
  const full = freeRooms.length === 0;
  return (
    <td
      title={full ? "全部包廂都被預約了" : `可預約：${freeRooms.map((r) => r.name).join("、")}`}
      className={cn(base, full ? STATE_STYLE.booked.cell : STATE_STYLE.free.cell, "font-semibold")}
    >
      {full ? "滿" : freeRooms.length}
      <span className="sr-only">{full ? "，全部被預約" : ` 間可預約`}</span>
    </td>
  );
}

function MissingDay({ column, today, rows, onRetry }: { column: Column; today: DateKey; rows: number; onRetry: (date: DateKey) => void }) {
  const { date, state } = column;
  const message =
    state.status === "loading"
      ? "讀取中…"
      : state.status === "error"
        ? "讀取失敗"
        : dayNumber(date) < dayNumber(today)
          ? "已經過了，官網沒有資料"
          : "官網沒有資料";
  return (
    <td rowSpan={rows} className="border-b border-l border-l-card bg-muted px-1 py-4 text-center align-top text-xs text-muted-foreground">
      {/* sticky so the reason stays in view while the table scrolls */}
      <div className="sticky top-16 flex flex-col items-center gap-2">
      <span className="[writing-mode:vertical-rl] sm:[writing-mode:horizontal-tb]">{message}</span>
      {state.status === "error" && (
        <button type="button" onClick={() => onRetry(date)} className="inline-flex items-center gap-1 rounded-md border bg-card px-1.5 py-1 text-foreground hover:bg-muted">
          <RotateCw aria-hidden className="size-3" />
          <span className="sr-only sm:not-sr-only">重試</span>
          <span className="sr-only">{formatDate(date, "medium")}</span>
        </button>
      )}
      </div>
    </td>
  );
}
