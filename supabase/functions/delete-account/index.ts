import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

console.log("Delete account function starting up");

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Only allow DELETE method
    if (req.method !== "DELETE") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: corsHeaders,
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const jwt = authHeader.replace("Bearer ", "");

    // Use a client with the anon key or token to get the user
    const supabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      },
    });

    const { data: { user }, error: getUserError } = await supabaseClient.auth
      .getUser();
    if (getUserError || !user) {
      return new Response(JSON.stringify({ error: "Could not verify user" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const userId = user.id;

    // Delete user account
    const { data: deletionData, error: deletionError } = await supabaseAdmin
      .auth.admin.deleteUser(userId);

    if (deletionError) {
      console.error("Error deleting user:", deletionError);
      return new Response(JSON.stringify({ error: deletionError.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ success: true, data: deletionData }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error("Unexpected error in delete_account function:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
