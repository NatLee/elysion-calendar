"use client";

import { CalendarDays, X } from "lucide-react";
import { useId, useRef } from "react";
import { DayPicker } from "react-day-picker";
import { zhTW } from "react-day-picker/locale";
import "react-day-picker/style.css";

import { SCHEDULE } from "@/config/site";
import { fromPickerDate, toPickerDate } from "@/lib/dates";
import { buttonClass } from "@/components/ui";
import type { DateKey } from "@/types/schedule";

interface Props {
  value: DateKey;
  today: DateKey;
  onChange: (date: DateKey) => void;
}

/** A month calendar in a popover (HTML popover attribute: Esc and clicking outside close it). */
export function DatePicker({ value, today, onChange }: Props) {
  const id = useId();
  const popover = useRef<HTMLDivElement>(null);

  return (
    <>
      <button type="button" popoverTarget={id} className={buttonClass("outline")}>
        <CalendarDays aria-hidden className="size-4" />
        選日期
      </button>
      <div
        id={id}
        ref={popover}
        popover="auto"
        role="dialog"
        aria-label="選擇日期"
        className="date-popover m-auto rounded-lg border bg-card p-3 text-card-foreground shadow-xl"
      >
        <div className="flex items-center justify-between gap-4 px-1 pb-1">
          <p className="text-sm font-semibold">選擇日期</p>
          <button type="button" popoverTarget={id} popoverTargetAction="hide" className={buttonClass("ghost", "icon")} aria-label="關閉">
            <X aria-hidden className="size-4" />
          </button>
        </div>
        <DayPicker
          key={value}
          mode="single"
          locale={zhTW}
          weekStartsOn={SCHEDULE.weekStartsOn}
          required
          selected={toPickerDate(value)}
          defaultMonth={toPickerDate(value)}
          today={toPickerDate(today)}
          onSelect={(date) => {
            onChange(fromPickerDate(date));
            popover.current?.hidePopover();
          }}
        />
      </div>
    </>
  );
}
