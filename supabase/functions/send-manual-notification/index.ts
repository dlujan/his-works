import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.0";
import dayjs from "https://esm.sh/dayjs@1.11.10";
import timezone from "https://esm.sh/dayjs@1.11.10/plugin/timezone";
import utc from "https://esm.sh/dayjs@1.11.10/plugin/utc";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { sendPushNotifications } from "./src/sendPushNotifications.ts";

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

  dayjs.extend(utc);
  dayjs.extend(timezone);

  try {
    const { testimonyId, title, body } = await req.json();

    const { data: testimony } = await supabase
      .from("testimony")
      .select("*")
      .eq("uuid", testimonyId)
      .single();

    if (!testimony) {
      return new Response(
        JSON.stringify({ message: "No testimony found." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: user } = await supabase
      .from("user")
      .select("*")
      .eq("uuid", testimony.user_uuid)
      .single();

    const { data: reminder } = await supabase
      .from("reminder")
      .insert({
        user_uuid: user.uuid,
        testimony_uuid: testimonyId,
        scheduled_for: "2026-03-18 06:00:00+00",
        sent_at: null,
        type: "one-time",
      })
      .select("*")
      .single();

    const message = {
      reminder: reminder,
      title: title || "✝️ Remember how God moved?",
      body: body || "Open to look back on what God did for you.",
      message: {
        to: user.expo_push_token,
        sound: "default",
        title: title || "✝️ Remember how God moved?",
        body: body || "Open to look back on what God did for you.",
        data: {
          testimony_uuid: testimony.uuid,
          reminder_uuid: reminder.uuid,
          url:
            `hisworks://testimony-display-modal/${testimony.uuid}?reminderId=${reminder.uuid}`,
        },
      },
    };

    // 4️⃣ Send notifications using Expo's HTTP/2 API
    const tickets = await sendPushNotifications(
      [message].map((m) => m.message),
    );

    return new Response(
      JSON.stringify({
        sent: 1,
        message: "Reminder sent successfully.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Error sending reminder:", err);
    return new Response(
      JSON.stringify({
        error: JSON.stringify(err) || "Failed to send reminder.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
