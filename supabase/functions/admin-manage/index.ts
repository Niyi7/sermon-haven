import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Per-IP rate limit (per instance)
const rateLimits = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string, max = 30, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = rateLimits.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

function verifyPin(pin: unknown): boolean {
  const adminPin = Deno.env.get("ADMIN_PIN");
  return !!adminPin && typeof pin === "string" && pin === adminPin;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function err(status: number, message: string) {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

function str(v: unknown, opts: { min?: number; max: number; required?: boolean }): string | null {
  if (v === undefined || v === null || v === "") {
    if (opts.required) throw new Error("Missing required string field");
    return null;
  }
  if (typeof v !== "string") throw new Error("Invalid string field");
  const t = v.trim();
  if (opts.min !== undefined && t.length < opts.min) throw new Error("Field too short");
  if (t.length > opts.max) throw new Error("Field too long");
  return t;
}

function safeUrl(v: unknown, max = 500): string | null {
  if (v === undefined || v === null || v === "") return null;
  if (typeof v !== "string") throw new Error("Invalid URL");
  const t = v.trim();
  if (t.length > max) throw new Error("URL too long");
  // Allow http(s) and site-relative paths only (no javascript:, data:)
  if (t.startsWith("/")) return t;
  try {
    const u = new URL(t);
    if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("Invalid URL protocol");
    return t;
  } catch {
    throw new Error("Invalid URL");
  }
}

function uuid(v: unknown): string {
  if (typeof v !== "string" || !UUID_RE.test(v)) throw new Error("Invalid id");
  return v;
}

function optDate(v: unknown): string | null {
  if (v === undefined || v === null || v === "") return null;
  if (typeof v !== "string" || !DATE_RE.test(v)) throw new Error("Invalid date");
  return v;
}

function validatePreacher(data: any) {
  return {
    name: str(data.name, { min: 1, max: 100, required: true })!,
    bio: str(data.bio, { max: 2000 }),
    image_url: safeUrl(data.image_url, 1000),
  };
}

function validateSermon(data: any) {
  return {
    title: str(data.title, { min: 1, max: 200, required: true })!,
    theme: str(data.theme, { min: 1, max: 100, required: true })!,
    description: str(data.description, { max: 5000 }),
    telegram_file_id: str(data.telegram_file_id, { max: 200 }),
    preacher_id: uuid(data.preacher_id),
    date: optDate(data.date),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";
    if (!checkRateLimit(ip)) {
      return err(429, "Too many requests");
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return err(400, "Invalid request");
    const { pin, action, data } = body as { pin?: unknown; action?: unknown; data?: any };

    if (!verifyPin(pin)) return err(401, "Unauthorized");
    if (typeof action !== "string") return err(400, "Invalid request");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let result;
    let validated: any;

    switch (action) {
      case "create_preacher": {
        validated = validatePreacher(data || {});
        const { data: preacher, error } = await supabase
          .from("preachers")
          .insert(validated)
          .select()
          .single();
        if (error) throw error;
        result = preacher;
        break;
      }

      case "update_preacher": {
        const id = uuid(data?.id);
        validated = validatePreacher(data || {});
        const { data: preacher, error } = await supabase
          .from("preachers")
          .update(validated)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        result = preacher;
        break;
      }

      case "delete_preacher": {
        const id = uuid(data?.id);
        await supabase.from("sermons").delete().eq("preacher_id", id);
        const { error } = await supabase.from("preachers").delete().eq("id", id);
        if (error) throw error;
        result = { success: true };
        break;
      }

      case "create_sermon": {
        validated = validateSermon(data || {});
        const { data: sermon, error } = await supabase
          .from("sermons")
          .insert(validated)
          .select()
          .single();
        if (error) throw error;
        result = sermon;
        break;
      }

      case "update_sermon": {
        const id = uuid(data?.id);
        validated = validateSermon(data || {});
        const { data: sermon, error } = await supabase
          .from("sermons")
          .update(validated)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        result = sermon;
        break;
      }

      case "delete_sermon": {
        const id = uuid(data?.id);
        const { error } = await supabase.from("sermons").delete().eq("id", id);
        if (error) throw error;
        result = { success: true };
        break;
      }

      default:
        return err(400, "Unknown action");
    }

    return new Response(
      JSON.stringify({ data: result }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Admin manage error:", {
      message: error?.message,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
    });
    // Surface only validation messages to the client; everything else is generic.
    const msg =
      typeof error?.message === "string" &&
      /^(Invalid|Missing|Field|Unknown|URL)/i.test(error.message)
        ? error.message
        : "Unable to complete operation";
    return err(400, msg);
  }
});
