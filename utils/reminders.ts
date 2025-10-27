import { Reminder } from "@/lib/types";
import dayjs, { Dayjs } from "dayjs";

export function getNextReminder(reminders: Reminder[]) {
  if (!reminders?.length) return null;

  const now = dayjs();
  const upcoming = reminders
    .map((r) => dayjs(r.scheduled_for))
    .filter((d) => d.isAfter(now))
    .sort((a, b) => a.valueOf() - b.valueOf());

  if (upcoming.length === 0) return null;

  const next = upcoming[0];
  const daysAway = next.diff(now, "day");

  if (daysAway <= 0) return "Today 🎉";
  if (daysAway === 1) return "Tomorrow";
  return `in ${daysAway} days`;
}

export function getNextReminderDate(
  baseDate: Dayjs,
  interval: "year" | "quarter"
) {
  const now = dayjs();
  const start = baseDate;
  const intervalMonths = interval === "year" ? 12 : 3;

  let next = start.add(intervalMonths, "month");

  // ⏳ Keep adding intervals until we're in the future
  while (next.isBefore(now, "day")) {
    next = next.add(intervalMonths, "month");
  }

  // 🧮 If the next reminder is less than one full interval away, skip ahead another interval
  // const monthsUntilNext = next.diff(now, "month", true);
  // if (monthsUntilNext < intervalMonths - 0.01) {
  //   // (Subtracting 0.01 just for floating point precision safety)
  //   next = next.add(intervalMonths, "month");
  // }

  return next.toISOString();
}
