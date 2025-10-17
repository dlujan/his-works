export type Reminder = {
  id: string;
  workId: string;
  dueAt: string;
  note: string;
};

const now = Date.now();

export const reminders: Reminder[] = [
  {
    id: "r1",
    workId: "1",
    dueAt: new Date(now + 1000 * 60 * 60 * 3).toISOString(), // in 3 hours
    note: "Follow up with the three families from downtown outreach.",
  },
  {
    id: "r2",
    workId: "2",
    dueAt: new Date(now + 1000 * 60 * 60 * 24).toISOString(), // in 1 day
    note: "Draft recap email for youth worship leaders.",
  },
  {
    id: "r3",
    workId: "3",
    dueAt: new Date(now + 1000 * 60 * 60 * 48).toISOString(), // in 2 days
    note: "Confirm produce order ahead of pantry restock.",
  },
  {
    id: "r4",
    workId: "1",
    dueAt: new Date(now - 1000 * 60 * 90).toISOString(), // 90 minutes overdue
    note: "Send thank-you texts to volunteers who joined Wednesday outreach.",
  },
];
