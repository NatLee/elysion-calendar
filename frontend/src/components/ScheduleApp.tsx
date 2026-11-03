"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { CalendarRange, ExternalLink, LayoutGrid, MicVocal, Table2 } from "lucide-react";
import { useState } from "react";

import { DatePicker } from "@/components/DatePicker";
import { DayGrid } from "@/components/DayGrid";
import { DayStatus, readyDay } from "@/components/DayStatus";
import { RoomCards } from "@/components/RoomCards";
import { Legend, buttonClass } from "@/components/ui";
import { WeekOverview } from "@/components/WeekOverview";
import { WeekStrip } from "@/components/WeekStrip";
import { SCHEDULE, SITE } from "@/config/site";
import { loadDay, useDaySchedules } from "@/hooks/useDaySchedules";
import { useShopClock } from "@/hooks/useShopClock";
import { formatDate, weekOf, type ZonedTime } from "@/lib/dates";
import { bookingAt, currentSlot, formatClock, pastSlotCount } from "@/lib/schedule";
import { cn } from "@/lib/utils";
import type { DateKey } from "@/types/schedule";

const VIEWS = [
  { id: "cards", label: "包廂卡片", Icon: LayoutGrid },
  { id: "grid", label: "時間表格", Icon: Table2 },
  { id: "week", label: "單週總覽", Icon: CalendarRange },
] as const;
type View = (typeof VIEWS)[number]["id"];

export function ScheduleApp() {
  const now = useShopClock();
  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col px-3 sm:px-6">
      <header className="flex items-center gap-3 py-4 sm:py-6">
        <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
          <MicVocal className="size-5" />
        </span>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground">{SITE.name}</p>
          <h1 className="text-lg font-bold leading-tight sm:text-xl">{SITE.title}</h1>
        </div>
      </header>
      <main className="flex-1 pb-10">{now ? <Schedule now={now} /> : <p role="status" className="py-10 text-muted-foreground">載入中…</p>}</main>
      <footer className="border-t py-6 text-xs leading-relaxed text-muted-foreground">
        <p>
          資料來自{SITE.sourceLabel}，由後端定期抓取，可能比官網晚幾分鐘。時間以店家的{SCHEDULE.timeZoneLabel}為準。
        </p>
        <p>
          原始碼在{" "}
          <a href={SITE.repoUrl} className="underline underline-offset-2 hover:text-foreground">
            GitHub
          </a>
          。
        </p>
      </footer>
    </div>
  );
}

function Schedule({ now }: { now: ZonedTime }) {
  const today = now.date;
  const [picked, setPicked] = useState<DateKey | null>(null);
  const [view, setView] = useState<View>("cards");
  const selected = picked ?? today;
  const week = weekOf(selected, SCHEDULE.weekStartsOn);
  const stateOf = useDaySchedules(week);
  const state = stateOf(selected);
  const ready = readyDay(state);
  const pastSlots = ready ? pastSlotCount(selected, ready.grid, now) : 0;
  const nowSlot = ready ? currentSlot(selected, ready.grid, now) : null;

  return (
    <>
      <nav aria-label="選擇日期" className="sticky top-0 z-40 -mx-3 border-b bg-background/95 px-3 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <WeekStrip week={week} selected={selected} today={today} onSelect={setPicked} />
      </nav>

      <div className="flex flex-wrap items-end justify-between gap-3 pb-3 pt-5">
        <div>
          <h2 className="flex flex-wrap items-baseline gap-x-2 text-xl font-bold sm:text-2xl">
            {formatDate(selected, "full")}
            {selected === today && <span className="rounded-full bg-primary-soft px-2 py-0.5 text-sm font-semibold text-primary">今天</span>}
          </h2>
          {ready && (
            <p className="mt-1 text-sm text-muted-foreground">
              {ready.day.rooms.length} 間包廂、{ready.day.rooms.reduce((n, r) => n + r.bookings.length, 0)} 筆預約
              {nowSlot !== null && `；現在 ${formatClock(now.minutes)}，有 ${ready.day.rooms.filter((r) => !bookingAt(r, nowSlot)).length} 間空著`}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DatePicker value={selected} today={today} onChange={setPicked} />
          <button type="button" className={buttonClass("outline")} disabled={selected === today} onClick={() => setPicked(null)}>
            回到今天
          </button>
          {state.status === "ready" && (
            <a href={state.data.url} target="_blank" rel="noopener noreferrer" className={buttonClass("ghost")}>
              官網原始頁面
              <ExternalLink aria-hidden className="size-4" />
              <span className="sr-only">（另開新視窗）</span>
            </a>
          )}
        </div>
      </div>

      <Tabs.Root value={view} onValueChange={(v) => setView(v as View)}>
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
          <Tabs.List aria-label="檢視方式" className="inline-flex rounded-lg bg-muted p-1">
            {VIEWS.map(({ id, label, Icon }) => (
              <Tabs.Trigger
                key={id}
                value={id}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors",
                  "hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm",
                )}
              >
                <Icon aria-hidden className="size-4" />
                {label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <Legend />
        </div>

        <Tabs.Content value="cards" className="focus-visible:ring-0">
          {ready ? (
            <RoomCards {...ready} pastSlots={pastSlots} />
          ) : (
            <DayStatus date={selected} today={today} state={state} onRetry={() => loadDay(selected)} />
          )}
        </Tabs.Content>
        <Tabs.Content value="grid" className="focus-visible:ring-0">
          {ready ? (
            <DayGrid {...ready} pastSlots={pastSlots} focusSlot={nowSlot} />
          ) : (
            <DayStatus date={selected} today={today} state={state} onRetry={() => loadDay(selected)} />
          )}
        </Tabs.Content>
        <Tabs.Content value="week" className="focus-visible:ring-0">
          <WeekOverview
            week={week}
            today={today}
            now={now}
            stateOf={stateOf}
            onRetry={loadDay}
            onOpenDay={(date) => {
              setPicked(date);
              setView("grid");
            }}
          />
        </Tabs.Content>
      </Tabs.Root>
    </>
  );
}
