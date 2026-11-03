import { cn } from "@/lib/utils";
import type { SlotState } from "@/lib/schedule";

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50";

const BUTTON_VARIANTS = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  outline: "border bg-card hover:bg-muted",
  ghost: "hover:bg-muted",
} as const;

const BUTTON_SIZES = {
  default: "h-9 px-3",
  icon: "size-9",
} as const;

export function buttonClass(variant: keyof typeof BUTTON_VARIANTS = "outline", size: keyof typeof BUTTON_SIZES = "default") {
  return cn(BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size]);
}

/** Background + text colour for each slot state; the legend, bars and tables all use this. */
export const STATE_STYLE: Record<SlotState, { cell: string; mark: string; label: string }> = {
  booked: { cell: "bg-booked text-booked-foreground", mark: "bg-booked-strong", label: "已預約" },
  free: { cell: "bg-free text-free-foreground", mark: "bg-free-strong", label: "可預約" },
  past: { cell: "bg-past text-past-foreground", mark: "bg-past-strong", label: "已過" },
};

export function Legend({ className }: { className?: string }) {
  return (
    <ul aria-label="圖例" className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground", className)}>
      {(Object.keys(STATE_STYLE) as SlotState[]).map((state) => (
        <li key={state} className="inline-flex items-center gap-1.5">
          <span aria-hidden className={cn("size-3 rounded-sm", STATE_STYLE[state].mark)} />
          {STATE_STYLE[state].label}
        </li>
      ))}
    </ul>
  );
}
