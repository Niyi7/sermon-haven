import { corsHeadersFor, jsonResponse, requireAdmin, audit } from "../_shared/admin.ts";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Allow-list of trusted image hosts for preacher photos.
const IMAGE_HOST_ALLOWLIST = [
  "supabase.co",
  "supabase.in",
  "lovable.app",
  "lovable.dev",
  "googleusercontent.com",
  "gravatar.com",
  "imgur.com",
  "i.imgur.com",
  "unsplash.com",
  "images.unsplash.com",
  "cloudinary.com",
  "res.cloudinary.com",
  "ibb.co",
  "i.ibb.co",
  "pinimg.com",
  "fbcdn.net",
  "twimg.com",
  "ggpht.com",
  "githubusercontent.com",
];

function str(v: unknown, opts: { min?: number; max: number; required?: boolean }): string | null {
  if (v === undefined || v === null || v === "") {
    if (opts.required) throw new Error("Missing required field");
    return null;
  }
  if (typeof v !== "string") throw new Error("Invalid string field");
  const t = v.trim();
  if (opts.min !== undefined && t.length < opts.min) throw new Error("Field too short");
  if (t.length > opts.max) throw new Error("Field too long");
  return t;
}

function imageUrl(v: unknown, max = 1000): string | null {
  if (v === undefined || v === null || v === "") return null;
  if (typeof v !== "string") throw new Error("Invalid URL");
  const t = v.trim();
  if (t.length > max) throw new Error("URL too long");
  let u: URL;
  try { u = new URL(t); } catch { throw new Error("Invalid URL"); }
  if (u.protocol !== "https:") throw new Error("Image URL must use https");
  const host = u.hostname.toLowerCase();
  const ok = IMAGE_HOST_ALLOWLIST.some((h) => host === h || host.endsWith(`.${h}`));
  if (!ok) throw new Error("Image host not allowed");
  return t;
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
    image_url: imageUrl(data.image_url, 1000),
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
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeadersFor(req) });

  const ctx = await requireAdmin(req, "admin-manage", 30, 60);
  if (ctx instanceof Response) return ctx;

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return jsonResponse(req, 400, { error: "Invalid request" });
    const { action, data } = body as { action?: unknown; data?: any };
    if (typeof action !== "string") return jsonResponse(req, 400, { error: "Invalid request" });

    let result: any;

    switch (action) {
      case "create_preacher": {
        const v = validatePreacher(data || {});
        const { data: row, error } = await ctx.supabase.from("preachers").insert(v).select().single();
        if (error) throw error;
        await audit(ctx, action, "preachers", row.id, v);
        result = row;
        break;
      }
      case "update_preacher": {
        const id = uuid(data?.id);
        const v = validatePreacher(data || {});
        const { data: row, error } = await ctx.supabase.from("preachers").update(v).eq("id", id).select().single();
        if (error) throw error;
        await audit(ctx, action, "preachers", id, v);
        result = row;
        break;
      }
      case "delete_preacher": {
        const id = uuid(data?.id);
        await ctx.supabase.from("sermons").delete().eq("preacher_id", id);
        const { error } = await ctx.supabase.from("preachers").delete().eq("id", id);
        if (error) throw error;
        await audit(ctx, action, "preachers", id, null);
        result = { success: true };
        break;
      }
      case "create_sermon": {
        const v = validateSermon(data || {});
        const { data: row, error } = await ctx.supabase.from("sermons").insert(v).select().single();
        if (error) throw error;
        await audit(ctx, action, "sermons", row.id, v);
        result = row;
        break;
      }
      case "update_sermon": {
        const id = uuid(data?.id);
        const v = validateSermon(data || {});
        const { data: row, error } = await ctx.supabase.from("sermons").update(v).eq("id", id).select().single();
        if (error) throw error;
        await audit(ctx, action, "sermons", id, v);
        result = row;
        break;
      }
      case "delete_sermon": {
        const id = uuid(data?.id);
        const { error } = await ctx.supabase.from("sermons").delete().eq("id", id);
        if (error) throw error;
        await audit(ctx, action, "sermons", id, null);
        result = { success: true };
        break;
      }
      default:
        return jsonResponse(req, 400, { error: "Unknown action" });
    }

    return jsonResponse(req, 200, { data: result });
  } catch (error: any) {
    console.error("admin-manage error", { message: error?.message });
    const msg =
      typeof error?.message === "string" &&
      /^(Invalid|Missing|Field|Unknown|URL|Image)/i.test(error.message)
        ? error.message
        : "Unable to complete operation";
    return jsonResponse(req, 400, { error: msg });
  }
});
