const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};
import OpenAI from "npm:openai@^4.83.0";

const openAIKey = Deno.env.get("OPEN_AI_API_KEY") as string;
const openai = new OpenAI({
  apiKey: openAIKey,
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { image_url } = await req.json();
    console.log(image_url);

    if (!image_url) {
      return new Response(
        JSON.stringify({ error: { message: "Missing required fields" } }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    const moderation = await openai.moderations.create({
      model: "omni-moderation-latest",
      input: [
        // { type: "text", text: "...text to classify goes here..." },
        {
          type: "image_url",
          image_url: {
            url: image_url,
            // can also use base64 encoded image URLs
            // url: "data:image/jpeg;base64,abcdefg..."
          },
        },
      ],
    });
    const { flagged, categories } = moderation.results[0];
    return new Response(
      JSON.stringify({
        flagged,
        categories: Object.entries(categories)
          .filter(([key, value]) => value === true)
          .map(([key]) => key),
      }),
      {
        status: 200,
        headers: corsHeaders,
      },
    );
  } catch (err) {
    console.error("Unexpected error in moderate-image function:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/moderate-image' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
