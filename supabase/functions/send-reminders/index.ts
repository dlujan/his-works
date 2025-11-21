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
    const hour = dayjs().hour() - 6; // fix GMT tz offset
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
      .eq("user.is_suspended", false)
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

    function getReminderTimePhrase(reminder: any) {
      const now = dayjs();
      const date = dayjs(reminder.testimony?.date);

      if (!date.isValid()) return null;

      const years = now.diff(date, "year");
      const months = now.diff(date, "month");
      const weeks = now.diff(date, "week");
      const days = now.diff(date, "day");
      const hours = now.diff(date, "hour");

      // Same day
      if (days === 0) {
        if (hours < 1) return "just now";
        if (hours === 1) return "1 hour ago";
        return `${hours} hours ago`;
      }

      // Under a week
      if (days < 7) {
        if (days === 1) return "1 day ago";
        return `${days} days ago`;
      }

      // Under a month
      if (weeks < 4) {
        if (weeks === 1) return "1 week ago";
        return `${weeks} weeks ago`;
      }

      // Under 1 year → month logic
      if (months < 12) {
        if (months === 1) return "1 month ago";

        // Humanize edges
        if (months >= 10) return "almost 1 year ago";
        if (months >= 7) return "nearly 1 year ago";
        return `${months} months ago`;
      }

      // Year logic
      if (years >= 1) {
        // Anniversary?
        const isAnniversary = now.isSame(date, "day") &&
          now.isSame(date, "month");

        if (years === 1) {
          return isAnniversary ? "1 year ago today" : "1 year ago";
        }

        // Humanize years
        const leftoverMonths = months % 12;

        if (leftoverMonths <= 2) return `just over ${years} years ago`;
        if (leftoverMonths >= 10) return `almost ${years + 1} years ago`;
        if (leftoverMonths >= 7) return `nearly ${years + 1} years ago`;

        return `${years} years ago`;
      }

      // Fallback (should never hit)
      return null;
    }

    // Dynamic lists for YEARLY + QUARTERLY
    const dynamicYearQuarterTitles = [
      "👇 Remember this?",
      "💭 Think back on this moment.",
      "📖 Look back on this testimony.",
      "🌟 A moment worth remembering.",
    ];
    const dynamicYearQuarterBodies = [
      (phrase: string) => `Remember this from ${phrase}?`,
      (phrase: string) => `God moved in your life ${phrase}. Tap to revisit.`,
      (phrase: string) => `A meaningful moment from ${phrase} ago.`,
      (phrase: string) => `Look back on God's goodness from ${phrase}.`,
    ];
    const genericTitles = [
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

    const genericBodies = [
      "Tap to revisit this testimony of God's faithfulness.",
      "Remember this moment when God showed up.",
      "Take a moment to reflect on this story of grace.",
      "Open to look back on this work of God in your life.",
    ];

    // 3️⃣ Build push messages
    const messages = timeSlottedReminders
      .filter((r) => isExpoPushToken(r.user?.expo_push_token))
      .map((r) => {
        // Get "1 year ago", "3 months ago", etc.
        const phrase = getReminderTimePhrase(r);

        let finalTitle;
        let finalBody;

        if (phrase) {
          // YEARLY or QUARTERLY dynamic messaging
          finalTitle = dynamicYearQuarterTitles[
            Math.floor(Math.random() * dynamicYearQuarterTitles.length)
          ];

          const bodyFn = dynamicYearQuarterBodies[
            Math.floor(Math.random() * dynamicYearQuarterBodies.length)
          ];

          finalBody = bodyFn(phrase);
        } else {
          // CUSTOM → use generic
          finalTitle =
            genericTitles[Math.floor(Math.random() * genericTitles.length)];
          finalBody =
            genericBodies[Math.floor(Math.random() * genericBodies.length)];
        }

        return {
          reminder: r,
          title: finalTitle,
          body: finalBody,
          message: {
            to: r.user!.expo_push_token,
            sound: "default",
            title: finalTitle,
            body: finalBody,
            data: {
              testimony_uuid: r.testimony_uuid,
              reminder_uuid: r.uuid,
              url: `hisworks://testimony-display-modal/${r.testimony_uuid}`,
            },
          },
        };
      });

    // 4️⃣ Send notifications using Expo's HTTP/2 API
    const tickets = await sendPushNotifications(messages.map((m) => m.message));
    console.log("tickets", tickets);

    // 5️⃣ Create new notification rows
    const { error: notificationsError } = await supabase
      .from("notification")
      .insert(
        messages.map((m) => ({
          user_uuid: m.reminder.user_uuid,
          type: "reminder",
          title: m.title,
          body: m.body,
          read: false,
          data: {
            reminder_uuid: m.reminder.uuid,
            testimony_uuid: m.reminder.testimony_uuid,
          },
        })),
      );

    if (notificationsError) throw notificationsError;

    // 6️⃣ Mark sent reminders
    const sentUuids = timeSlottedReminders.map((r) => r.uuid);
    const { error: updateError } = await supabase
      .from("reminder")
      .update({ sent_at: new Date().toISOString() })
      .in("uuid", sentUuids);

    if (updateError) throw updateError;

    // 7️⃣ Reschedule new reminders based on their type
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
