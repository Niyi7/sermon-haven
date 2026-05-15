import { corsHeadersFor, jsonResponse, requireAdmin, audit } from "../_shared/admin.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeadersFor(req) });

  const ctx = await requireAdmin(req, "scan-telegram", 10, 60);
  if (ctx instanceof Response) return ctx;

  try {
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const channelId = Deno.env.get("TELEGRAM_CHANNEL_ID");
    if (!botToken || !channelId) return jsonResponse(req, 500, { error: "Telegram not configured" });

    const url = `https://api.telegram.org/bot${botToken}/getUpdates?allowed_updates=["channel_post"]&limit=100`;
    const response = await fetch(url);
    const data = await response.json();
    if (!data.ok) {
      console.error("Telegram API error");
      return jsonResponse(req, 502, { error: "Unable to fetch channel updates" });
    }

    const channelIdNum = parseInt(channelId, 10);
    const audioFiles: Array<{
      file_id: string; file_name: string; duration: number | null; date: number; update_id: number;
    }> = [];

    for (const update of data.result || []) {
      const post = update.channel_post;
      if (!post) continue;
      const chatId = post.chat?.id;
      if (String(chatId) !== String(channelId) && chatId !== channelIdNum) continue;

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

    await audit(ctx, "scan_telegram", null, null, { found: audioFiles.length });
    return jsonResponse(req, 200, { files: audioFiles });
  } catch (error) {
    console.error("scan error", error);
    return jsonResponse(req, 500, { error: "Internal server error" });
  }
});
