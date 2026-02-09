const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function verifyPin(pin: string): boolean {
  const adminPin = Deno.env.get("ADMIN_PIN");
  return !!adminPin && pin === adminPin;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { pin } = await req.json();

    if (!verifyPin(pin)) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!botToken) {
      return new Response(
        JSON.stringify({ error: "TELEGRAM_BOT_TOKEN not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const channelId = Deno.env.get("TELEGRAM_CHANNEL_ID");
    if (!channelId) {
      return new Response(
        JSON.stringify({ error: "TELEGRAM_CHANNEL_ID not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Scanning for audio in channel: ${channelId}`);

    // Fetch updates from Telegram
    const url = `https://api.telegram.org/bot${botToken}/getUpdates?allowed_updates=["channel_post"]&limit=100`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.ok) {
      console.error("Telegram API error:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "Failed to fetch updates from Telegram", details: data.description }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const channelIdNum = parseInt(channelId, 10);
    const audioFiles: Array<{
      file_id: string;
      file_name: string;
      duration: number | null;
      date: number;
      update_id: number;
    }> = [];

    for (const update of data.result || []) {
      const post = update.channel_post;
      if (!post) continue;

      // Match channel ID (can be numeric or string comparison)
      const chatId = post.chat?.id;
      if (String(chatId) !== String(channelId) && chatId !== channelIdNum) continue;

      // Check for audio, voice, or document (audio files)
      const audio = post.audio || post.voice || null;
      const doc = post.document;

      if (audio) {
        audioFiles.push({
          file_id: audio.file_id,
          file_name: audio.file_name || audio.title || `Audio ${post.message_id}`,
          duration: audio.duration || null,
          date: post.date,
          update_id: update.update_id,
        });
      } else if (doc && doc.mime_type?.startsWith("audio/")) {
        audioFiles.push({
          file_id: doc.file_id,
          file_name: doc.file_name || `Document ${post.message_id}`,
          duration: null,
          date: post.date,
          update_id: update.update_id,
        });
      }
    }

    console.log(`Found ${audioFiles.length} audio files`);

    return new Response(
      JSON.stringify({ files: audioFiles }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Scan error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
