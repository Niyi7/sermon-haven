import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { pin, action, data } = await req.json();

    if (!verifyPin(pin)) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let result;

    switch (action) {
      case "create_preacher": {
        const { name, bio, image_url } = data;
        const { data: preacher, error } = await supabase
          .from("preachers")
          .insert({ name, bio: bio || null, image_url: image_url || null })
          .select()
          .single();
        if (error) throw error;
        result = preacher;
        break;
      }

      case "update_preacher": {
        const { id, name, bio, image_url } = data;
        const { data: preacher, error } = await supabase
          .from("preachers")
          .update({ name, bio: bio || null, image_url: image_url || null })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        result = preacher;
        break;
      }

      case "delete_preacher": {
        const { id } = data;
        // Delete associated sermons first
        await supabase.from("sermons").delete().eq("preacher_id", id);
        const { error } = await supabase.from("preachers").delete().eq("id", id);
        if (error) throw error;
        result = { success: true };
        break;
      }

      case "create_sermon": {
        const { title, theme, description, telegram_file_id, preacher_id, date } = data;
        const { data: sermon, error } = await supabase
          .from("sermons")
          .insert({
            title,
            theme,
            description: description || null,
            telegram_file_id: telegram_file_id || null,
            preacher_id,
            date: date || null,
          })
          .select()
          .single();
        if (error) throw error;
        result = sermon;
        break;
      }

      case "update_sermon": {
        const { id, title, theme, description, telegram_file_id, preacher_id, date } = data;
        const { data: sermon, error } = await supabase
          .from("sermons")
          .update({
            title,
            theme,
            description: description || null,
            telegram_file_id: telegram_file_id || null,
            preacher_id,
            date: date || null,
          })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        result = sermon;
        break;
      }

      case "delete_sermon": {
        const { id } = data;
        const { error } = await supabase.from("sermons").delete().eq("id", id);
        if (error) throw error;
        result = { success: true };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(
      JSON.stringify({ data: result }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Admin manage error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
