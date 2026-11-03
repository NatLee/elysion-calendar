"use client";

import { useMemo } from "react";

import type { ReadyDay } from "@/components/DayStatus";
import { STATE_STYLE } from "@/components/ui";
import { useScrollToRow } from "@/hooks/useScrollToRow";
import { formatDate } from "@/lib/dates";
import { formatClock, formatDuration, formatRange, isNextDay, roomSegments, segmentMinutes, slotMinutes, type Segment } from "@/lib/schedule";
import { cn } from "@/lib/utils";

interface Props extends ReadyDay {
  pastSlots: number;
  /** Row to scroll into view first (the current time on today's page). */
  focusSlot: number | null;
}

/** Time down the side, rooms across the top; each booking or free stretch is one merged cell. */
export function DayGrid({ day, grid, pastSlots, focusSlot }: Props) {
  const columns = useMemo(
    () => day.rooms.map((room) => new Map(roomSegments(room, grid, pastSlots).map((s) => [s.start, s] as const))),
    [day, grid, pastSlots],
  );
  const slots = Array.from({ length: grid.slot_count }, (_, i) => i);
  const { scroller, row } = useScrollToRow(focusSlot, day.date);

  return (
    <div
      ref={scroller}
      tabIndex={0}
      role="region"
      aria-label={`${formatDate(day.date, "medium")} 時間表格，可以捲動`}
      className="relative max-h-[70vh] overflow-auto rounded-lg border bg-card"
    >
      <table className="w-full table-fixed border-separate border-spacing-0 text-xs sm:text-sm">
        <caption className="sr-only">
          {formatDate(day.date, "full")}，每 {grid.slot_minutes} 分鐘一格的包廂預約狀態
        </caption>
        <colgroup>
          <col className="w-11 sm:w-24" />
          {day.rooms.map((room) => (
            <col key={room.id} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className="sticky left-0 top-0 z-30 border-b border-r bg-card px-1 py-2 text-left font-semibold">
              時間
            </th>
            {day.rooms.map((room) => (
              <th key={room.id} scope="col" className="sticky top-0 z-20 border-b bg-card px-0.5 py-2 text-center text-[11px] font-semibold leading-tight sm:px-1 sm:text-sm">
                <span className="block break-words">{room.name}</span>
                {room.system && <span className="block text-[10px] font-normal text-muted-foreground sm:text-[11px]">{room.system}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {slots.map((slot) => {
            const minutes = slotMinutes(grid, slot);
            const firstOfNextDay = isNextDay(minutes) && !isNextDay(minutes - grid.slot_minutes);
            const onTheHour = minutes % 60 === 0;
            return (
              <tr key={slot} ref={slot === focusSlot ? row : undefined} className="h-7">
                <th
                  scope="row"
                  className={cn(
                    "sticky left-0 z-10 border-r bg-card px-1 text-left align-top font-normal tabular-nums",
                    onTheHour ? "text-foreground" : "text-muted-foreground",
                    firstOfNextDay && "border-t-2 border-t-foreground/40",
                  )}
                >
                  {formatClock(minutes)}
                  {firstOfNextDay && <span className="block text-[11px] font-semibold">隔天</span>}
                </th>
                {columns.map((column, i) => {
                  const segment = column.get(slot);
                  return segment ? <SegmentCell key={day.rooms[i].id} segment={segment} grid={grid} nextDayLine={firstOfNextDay} /> : null;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SegmentCell({ segment, grid, nextDayLine }: { segment: Segment; grid: ReadyDay["grid"]; nextDayLine: boolean }) {
  const rows = segment.end - segment.start;
  const range = formatRange(grid, segment.start, segment.end);
  const style = STATE_STYLE[segment.state];
  const title = segment.booking ? `${segment.booking.customer}，${range}` : `${style.label}，${range}`;
  return (
    <td
      rowSpan={rows}
      title={title}
      className={cn(
        "border-b border-l border-l-card px-1.5 py-1 align-top",
        style.cell,
        segment.state === "booked" && "border-l-4 border-l-booked-strong",
        nextDayLine && "border-t-2 border-t-foreground/40",
      )}
    >
      {segment.booking ? (
        <>
          <span className="line-clamp-2 break-words font-semibold">{segment.booking.customer}</span>
          {rows > 1 && <span className="block tabular-nums opacity-90">{range}</span>}
          {rows > 2 && <span className="block opacity-90">{formatDuration(segmentMinutes(grid, segment))}</span>}
        </>
      ) : (
        <>
          <span className={cn(segment.state === "free" && "font-medium")}>{style.label}</span>
          {rows > 1 && <span className="block tabular-nums opacity-90">{range}</span>}
        </>
      )}
    </td>
  );
}
