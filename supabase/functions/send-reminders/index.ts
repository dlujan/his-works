import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.0";
import dayjs from "https://esm.sh/dayjs@1.11.10";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  isExpoPushToken,
  sendPushNotifications,
} from "./src/sendPushNotifications.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supURL = Deno.env.get("SUPABASE_URL")!;
const supKEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supURL, supKEY);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Figure out if this is the morning or evening run
    const hour = dayjs().hour();
    const currentPeriod = hour < 12 ? "morning" : "evening";
    const now = dayjs();
    const startOfDay = now.startOf("day").toISOString();
    const endOfDay = now.endOf("day").toISOString();

    // 1️⃣ Get all reminders due today that haven’t been sent
    const { data: reminders, error } = await supabase
      .from("reminder")
      .select(
        `
        *,
        user(*),
        testimony(*)
      `,
      )
      .is("sent_at", null)
      .gte("scheduled_for", startOfDay)
      .lte("scheduled_for", endOfDay);

    if (error) throw error;

    if (!reminders || reminders.length === 0) {
      console.log("No reminders due today.");
      return new Response(
        JSON.stringify({ message: "No reminders due today." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2️⃣ Filter by the user’s preferred reminder time
    const timeSlottedReminders = reminders.filter((r) => {
      const pref = r.user?.reminder_settings?.timeOfDay;
      return !pref || pref === currentPeriod;
    });

    if (timeSlottedReminders.length === 0) {
      console.log(`No ${currentPeriod} reminders due.`);
      return new Response(
        JSON.stringify({
          message: `No ${currentPeriod} reminders due.`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const titles = [
      "👇 Remember this moment?",
      "👆 Tap to revisit God's work.",
      "⏳ Look back on His goodness.",
      "💫 Thank God again for this.",
      "🙏 Reflect on His faithfulness.",
      "✨ When God showed up for you.",
      "🌿 A moment of grace to recall.",
      "🌟 Remember how God moved?",
      "💭 Revisit God's goodness.",
      "🙌 See what God did here.",
      "🔥 When God came through.",
      "🌈 An answered prayer to recall.",
      "❤️ A reminder of His love.",
    ];
    const bodies = [
      "Tap to revisit this testimony of God’s faithfulness.",
      "Remember this moment when God showed up.",
      "Take a moment to reflect on this story of grace.",
      "Open to look back on this work of God in your life.",
    ];

    // 3️⃣ Build push messages
    const messages = timeSlottedReminders
      .filter((r) => isExpoPushToken(r.user?.expo_push_token))
      .map((r) => ({
        to: r.user!.expo_push_token,
        sound: "default",
        title: titles[Math.floor(Math.random() * titles.length)],
        body: bodies[Math.floor(Math.random() * bodies.length)],
        data: {
          testimony_uuid: r.testimony_uuid,
          reminder_uuid: r.uuid,
          url: `hisworks://(tabs)/testimonies/${r.testimony_uuid}`, // TODO url to display screen instead
        },
      }));

    // 4️⃣ Send notifications using Expo's HTTP/2 API
    const tickets = await sendPushNotifications(messages);
    console.log("tickets", tickets);

    // 5️⃣ Mark sent reminders
    const sentUuids = timeSlottedReminders.map((r) => r.uuid);
    const { error: updateError } = await supabase
      .from("reminder")
      .update({ sent_at: new Date().toISOString() })
      .in("uuid", sentUuids);

    if (updateError) throw updateError;

    // 6️⃣ Reschedule new reminders based on their type
    for (const reminder of timeSlottedReminders) {
      // Skip if no type (e.g., surprise reminders & other)
      if (!reminder.type) continue;

      const current = dayjs(reminder.scheduled_for);
      let next: string | null = null;

      if (reminder.type === "yearly") {
        next = current.add(1, "year").toISOString();
      } else if (reminder.type === "quarterly") {
        next = current.add(3, "month").toISOString();
      }

      if (next) {
        const { error: rescheduleError } = await supabase
          .from("reminder")
          .insert({
            user_uuid: reminder.user.uuid,
            testimony_uuid: reminder.testimony.uuid,
            scheduled_for: next,
            sent_at: null,
            type: reminder.type,
          });

        if (rescheduleError) {
          console.error(
            `Failed to reschedule reminder ${reminder.uuid}:`,
            rescheduleError,
          );
        }
      }
    }

    return new Response(
      JSON.stringify({
        sent: timeSlottedReminders.length,
        message: "Reminders sent successfully.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Error sending reminders:", err);
    return new Response(
      JSON.stringify({
        error: JSON.stringify(err) || "Failed to send reminders.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
