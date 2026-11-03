/**
 * Everything about the shop, the data source and the page lives here.
 * Components and helpers read these values instead of repeating them.
 */
export const SITE = {
  name: "Elysion Calendar",
  title: "艾莉森包廂預約小日曆",
  description: "快速查詢艾莉森 KTV 包廂的預約狀況：哪一天、哪個時段、哪一間還空著。",
  sourceLabel: "艾莉森官網預約表",
  repoUrl: "https://github.com/NatLee/elysion-calendar",
} as const;

export const SCHEDULE = {
  /** The shop's clock. "Today" and "already over" follow it, not the viewer's time zone. */
  timeZone: "Asia/Taipei",
  timeZoneLabel: "台灣時間",
  /** 0 = Sunday, 1 = Monday. The week strip and the weekly overview start on this day. */
  weekStartsOn: 1,
  /** Same-origin API path; next.config.ts (dev) or nginx (Docker) forwards it to the backend. */
  apiPath: "/api/daily-schedule",
  /** How often "now" moves forward, so past slots turn grey while the page stays open. */
  clockTickMs: 60_000,
} as const;
