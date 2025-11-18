// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

Deno.serve(async (req) => {
  const { record: report } = await req.json();

  const adminEmail = "daniel.lujan96@gmail.com";

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "HisWorks Moderation <info@littlelakewebdesigns.com>",
      to: [adminEmail],
      subject: "⚠️ New Content Report Submitted",
      html: `<h2>New Report Submitted</h2>
      <pre>
      <ul>
      <li>created_at: ${report.created_at}</li>
      <li>uuid: ${report.uuid}</li>
      <li>entity_type: ${report.entity_type}</li>
      <li>entity_uuid: ${report.entity_uuid}</li>
      <li>reporter_uuid: ${report.reporter_uuid}</li>
      <li>reason: ${report.reason}</li>
      </ul>
      </pre>`,
    }),
  });

  return new Response("ok", { status: 200 });
});
