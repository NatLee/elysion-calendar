import { STATE_STYLE } from "@/components/ui";
import type { ReadyDay } from "@/components/DayStatus";
import { MINUTES_PER_DAY } from "@/lib/dates";
import {
  formatClock,
  formatDuration,
  formatRange,
  freeMinutes,
  roomSegments,
  segmentMinutes,
  slotAt,
  slotMinutes,
  type Segment,
} from "@/lib/schedule";
import { cn } from "@/lib/utils";
import type { Grid } from "@/types/schedule";

interface Props extends ReadyDay {
  pastSlots: number;
}

/** One card per room: a bar of the whole day, the free periods still ahead, and the bookings. */
export function RoomCards({ day, grid, pastSlots }: Props) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {day.rooms.map((room) => {
        const segments = roomSegments(room, grid, pastSlots);
        const free = segments.filter((s) => s.state === "free");
        const booked = segments.filter((s) => s.state === "booked");
        return (
          <li key={room.id}>
            <article className="flex h-full flex-col gap-3 rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
              <header className="flex items-start justify-between gap-2">
                <h3 className="font-semibold leading-snug">{room.name}</h3>
                {room.system && (
                  <span className="shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium text-muted-foreground">{room.system}</span>
                )}
              </header>

              <DayBar grid={grid} segments={segments} />

              <section aria-label={`${room.name} 可預約時段`}>
                <h4 className="mb-1.5 text-xs font-semibold text-muted-foreground">
                  可預約{free.length > 0 && `（共 ${formatDuration(freeMinutes(grid, segments))}）`}
                </h4>
                {free.length > 0 ? (
                  <ul className="flex flex-wrap gap-1.5">
                    {free.map((s) => (
                      <li key={s.start} className={cn("rounded-md px-2 py-1 text-xs font-medium tabular-nums", STATE_STYLE.free.cell)}>
                        {formatRange(grid, s.start, s.end)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">沒有空檔了</p>
                )}
              </section>

              <section aria-label={`${room.name} 預約`}>
                <h4 className="mb-1.5 text-xs font-semibold text-muted-foreground">已預約（{booked.length} 筆）</h4>
                {booked.length > 0 ? (
                  <ul className="divide-y">
                    {booked.map((s) => (
                      <li key={s.start} className={cn("flex items-baseline gap-3 py-1.5 text-sm", s.end <= pastSlots && "text-muted-foreground")}>
                        <span className="shrink-0 tabular-nums">{formatRange(grid, s.start, s.end)}</span>
                        <span className="min-w-0 flex-1 truncate font-medium" title={s.booking?.customer}>
                          {s.booking?.customer}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">{formatDuration(segmentMinutes(grid, s))}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">沒有預約</p>
                )}
              </section>
            </article>
          </li>
        );
      })}
    </ul>
  );
}

/** The whole day as a thin bar; the lists below say the same thing in words. */
function DayBar({ grid, segments }: { grid: Grid; segments: Segment[] }) {
  const percent = (slot: number) => `${(slot / grid.slot_count) * 100}%`;
  const midnight = slotAt(grid, MINUTES_PER_DAY);
  const ticks = [0, ...(midnight ? [midnight] : []), grid.slot_count];
  return (
    <div aria-hidden>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
        {segments.map((s) => (
          <span key={s.start} className={STATE_STYLE[s.state].mark} style={{ width: percent(s.end - s.start) }} />
        ))}
      </div>
      <div className="relative mt-1 h-4 text-[11px] tabular-nums text-muted-foreground">
        {ticks.map((slot, i) => (
          <span
            key={slot}
            className={cn("absolute", i === 0 ? "left-0" : i === ticks.length - 1 ? "right-0" : "-translate-x-1/2")}
            style={i > 0 && i < ticks.length - 1 ? { left: percent(slot) } : undefined}
          >
            {formatClock(slotMinutes(grid, slot))}
          </span>
        ))}
      </div>
    </div>
  );
}
