import { Reminder } from "@/lib/types";
import dayjs from "dayjs";

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
