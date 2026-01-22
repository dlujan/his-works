// sendReminders.ts
const EXPO_API_URL = "https://exp.host/--/api/v2/push/send";

export function isExpoPushToken(token: string): boolean {
  return /^ExponentPushToken\[[A-Za-z0-9\-_]+\]$/.test(token);
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export async function sendPushNotifications(messages: any[]) {
  const chunks = chunkArray(messages, 100);
  let tickets: { status: string; id: string }[] = [];

  for (const chunk of chunks) {
    const res = await fetch(EXPO_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chunk),
    });

    const data = await res.json();
    tickets = [...tickets, ...data.data];
  }
  return tickets;
}
