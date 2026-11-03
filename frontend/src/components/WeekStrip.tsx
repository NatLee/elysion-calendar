import { ChevronLeft, ChevronRight } from "lucide-react";

import { buttonClass } from "@/components/ui";
import { addDays, dayOfMonth, formatDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { DateKey } from "@/types/schedule";

interface Props {
  week: DateKey[];
  selected: DateKey;
  today: DateKey;
  onSelect: (date: DateKey) => void;
}

/** Seven day buttons for the selected week, with arrows to the week before and after. */
export function WeekStrip({ week, selected, today, onSelect }: Props) {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <button type="button" className={cn(buttonClass("ghost", "icon"), "shrink-0")} onClick={() => onSelect(addDays(selected, -7))}>
        <ChevronLeft aria-hidden className="size-5" />
        <span className="sr-only">上一週</span>
      </button>
      <ol className="grid min-w-0 flex-1 grid-cols-7 gap-1 sm:gap-2">
        {week.map((date) => {
          const isSelected = date === selected;
          const isToday = date === today;
          return (
            <li key={date}>
              <button
                type="button"
                aria-pressed={isSelected}
                aria-current={isToday ? "date" : undefined}
                onClick={() => onSelect(date)}
                className={cn(
                  "relative flex w-full flex-col items-center rounded-md border py-1.5 leading-tight transition-colors sm:flex-row sm:justify-center sm:gap-2 sm:py-2",
                  isSelected ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
                  isToday && !isSelected && "border-primary text-primary",
                )}
              >
                <span aria-hidden className="text-xs sm:text-sm">{formatDate(date, "weekdayNarrow")}</span>
                <span aria-hidden className="text-base font-semibold tabular-nums">{dayOfMonth(date)}</span>
                <span className="sr-only">
                  {formatDate(date, "full")}
                  {isToday && "（今天）"}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <button type="button" className={cn(buttonClass("ghost", "icon"), "shrink-0")} onClick={() => onSelect(addDays(selected, 7))}>
        <ChevronRight aria-hidden className="size-5" />
        <span className="sr-only">下一週</span>
      </button>
    </div>
  );
}
