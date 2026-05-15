import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { telegram_file_id } = await req.json();

    if (!telegram_file_id || typeof telegram_file_id !== "string" || telegram_file_id.length > 200) {
      return new Response(
        JSON.stringify({ error: "Invalid request" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify this file_id is associated with a published sermon to prevent
    // arbitrary use of our bot token for fetching unrelated Telegram files.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: sermon, error: sermonError } = await supabase
      .from("sermons")
      .select("id")
      .eq("telegram_file_id", telegram_file_id)
      .maybeSingle();

    if (sermonError) {
      console.error("Sermon lookup failed:", sermonError);
      return new Response(
        JSON.stringify({ error: "Unable to resolve audio" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!sermon) {
      return new Response(
        JSON.stringify({ error: "Audio not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!botToken) {
      console.error("TELEGRAM_BOT_TOKEN not configured");
      return new Response(
        JSON.stringify({ error: "Service unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const getFileUrl = `https://api.telegram.org/bot${botToken}/getFile?file_id=${encodeURIComponent(telegram_file_id)}`;
    const telegramResponse = await fetch(getFileUrl);
    const telegramData = await telegramResponse.json();

    if (!telegramData.ok) {
      console.error("Telegram API error:", JSON.stringify(telegramData));
      return new Response(
        JSON.stringify({ error: "Unable to fetch audio file" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const filePath = telegramData.result.file_path;
    const downloadUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;

    return new Response(
      JSON.stringify({ url: downloadUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("get-audio-link unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Service unavailable" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
