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

    if (!telegram_file_id) {
      console.error("Missing telegram_file_id in request body");
      return new Response(
        JSON.stringify({ error: "telegram_file_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!botToken) {
      console.error("TELEGRAM_BOT_TOKEN not configured");
      return new Response(
        JSON.stringify({ error: "Bot token not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetching file info for telegram_file_id: ${telegram_file_id}`);

    // Call Telegram's getFile API
    const getFileUrl = `https://api.telegram.org/bot${botToken}/getFile?file_id=${telegram_file_id}`;
    const telegramResponse = await fetch(getFileUrl);
    const telegramData = await telegramResponse.json();

    if (!telegramData.ok) {
      console.error("Telegram API error:", JSON.stringify(telegramData));
      return new Response(
        JSON.stringify({ error: "Failed to get file from Telegram", details: telegramData.description }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const filePath = telegramData.result.file_path;
    const downloadUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;

    console.log(`Successfully resolved file path: ${filePath}`);

    return new Response(
      JSON.stringify({ url: downloadUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
