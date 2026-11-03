import { SCHEDULE } from "@/config/site";
import type { DateKey, DaySchedule } from "@/types/schedule";

export class ScheduleError extends Error {}

/** What the backend says when it fails, falling back to a short Chinese message. */
async function describeFailure(response: Response): Promise<string> {
  const fallback = `伺服器回應 ${response.status}`;
  try {
    const body = await response.json();
    return typeof body?.detail === "string" ? `${fallback}：${body.detail}` : fallback;
  } catch {
    return fallback;
  }
}

export async function fetchDaySchedule(date: DateKey, signal?: AbortSignal): Promise<DaySchedule> {
  let response: Response;
  try {
    response = await fetch(`${SCHEDULE.apiPath}/${date}`, { signal });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ScheduleError("連不上伺服器，請確認網路後再試一次。");
  }
  if (!response.ok) throw new ScheduleError(await describeFailure(response));
  const data = (await response.json()) as DaySchedule;
  if (!Array.isArray(data?.rooms)) throw new ScheduleError("伺服器回傳的資料格式不對。");
  return data;
}
