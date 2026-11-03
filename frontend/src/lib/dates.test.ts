import { describe, expect, it } from "vitest";

import {
  absoluteMinutes,
  addDays,
  dayNumber,
  formatDate,
  fromPickerDate,
  isDateKey,
  startOfWeek,
  toPickerDate,
  weekOf,
  weekday,
  zonedNow,
} from "@/lib/dates";

describe("date keys", () => {
  it("round-trips through day numbers", () => {
    expect(dayNumber("1970-01-01")).toBe(0);
    expect(dayNumber("2026-11-07")).toBe(20764);
    expect(addDays("2026-11-07", 0)).toBe("2026-11-07");
  });

  it("adds days across months, years and leap days", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("knows the weekday", () => {
    expect(weekday("1970-01-01")).toBe(4); // Thursday
    expect(weekday("2026-11-07")).toBe(6); // Saturday
    expect(weekday("2026-11-08")).toBe(0); // Sunday
  });

  it("starts weeks on Monday or Sunday", () => {
    expect(startOfWeek("2026-11-07", 1)).toBe("2026-11-02");
    expect(startOfWeek("2026-11-08", 1)).toBe("2026-11-02"); // Sunday belongs to the week before
    expect(startOfWeek("2026-11-09", 1)).toBe("2026-11-09");
    expect(startOfWeek("2026-11-07", 0)).toBe("2026-11-01");
    expect(weekOf("2026-11-04", 1)).toEqual([
      "2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06", "2026-11-07", "2026-11-08",
    ]);
  });

  it("validates input", () => {
    expect(isDateKey("2026-11-07")).toBe(true);
    expect(isDateKey("2026-02-30")).toBe(false);
    expect(isDateKey("2026-1-7")).toBe(false);
    expect(isDateKey("garbage")).toBe(false);
    expect(() => dayNumber("garbage")).toThrow();
  });
});

describe("the shop's clock", () => {
  it("reads the wall clock in the shop's time zone, whatever the instant's offset", () => {
    // 2026-11-06 23:30 in UTC is already Saturday morning in Taipei
    expect(zonedNow(new Date("2026-11-06T23:30:00Z"), "Asia/Taipei")).toEqual({ date: "2026-11-07", minutes: 7 * 60 + 30 });
    expect(zonedNow(new Date("2026-11-07T14:20:00+08:00"), "Asia/Taipei")).toEqual({ date: "2026-11-07", minutes: 14 * 60 + 20 });
    expect(zonedNow(new Date("2026-11-07T00:00:00+08:00"), "Asia/Taipei")).toEqual({ date: "2026-11-07", minutes: 0 });
  });

  it("orders times across midnight", () => {
    expect(absoluteMinutes("2026-11-07", 24 * 60 + 30)).toBe(absoluteMinutes("2026-11-08", 30));
  });
});

describe("labels", () => {
  it("formats dates in Traditional Chinese the same way everywhere", () => {
    expect(formatDate("2026-11-07", "full")).toBe("2026年11月7日 星期六");
    expect(formatDate("2026-11-07", "medium")).toBe("11月7日 週六");
    expect(formatDate("2026-11-07", "monthDay")).toBe("11/7");
    expect(formatDate("2026-11-07", "weekday")).toBe("週六");
    expect(formatDate("2026-11-07", "weekdayNarrow")).toBe("六");
    expect(formatDate("2026-01-04", "full")).toBe("2026年1月4日 星期日");
  });

  it("converts to and from the date picker's local dates", () => {
    expect(fromPickerDate(toPickerDate("2026-11-07"))).toBe("2026-11-07");
    expect(fromPickerDate(new Date(2026, 0, 31))).toBe("2026-01-31");
  });
});
