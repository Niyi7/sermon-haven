// Shared helpers for admin edge functions.
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGIN_SUFFIXES = [".lovable.app", ".lovable.dev"];
const ALLOWED_ORIGIN_EXACT = new Set<string>([
  "http://localhost:5173",
  "http://localhost:8080",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
]);
// Comma-separated list of additional allowed origins (e.g. published custom domain).
for (const o of (Deno.env.get("ALLOWED_ORIGINS") ?? "").split(",")) {
  const t = o.trim();
  if (t) ALLOWED_ORIGIN_EXACT.add(t);
}

export function corsHeadersFor(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  let allow = "";
  if (origin && (ALLOWED_ORIGIN_EXACT.has(origin) ||
      ALLOWED_ORIGIN_SUFFIXES.some((s) => {
        try { return new URL(origin).hostname.endsWith(s); } catch { return false; }
      }))) {
    allow = origin;
  }
  return {
    "Access-Control-Allow-Origin": allow,
    "Vary": "Origin",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

export function jsonResponse(req: Request, status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeadersFor(req), "Content-Type": "application/json" },
  });
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

export interface AdminContext {
  supabase: SupabaseClient;        // service-role client
  userClient: SupabaseClient;      // user-scoped client (for getClaims)
  userId: string;
  email: string | null;
  ip: string;
}

/**
 * Verifies the request bearer token, ensures the user has the 'admin' role,
 * applies a DB-backed rate limit, and returns a service-role client for writes.
 */
export async function requireAdmin(
  req: Request,
  rateLimitAction: string,
  rateMax = 30,
  rateWindowSeconds = 60,
): Promise<AdminContext | Response> {
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return jsonResponse(req, 401, { error: "Unauthorized" });

  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: auth } },
  });
  const token = auth.slice(7);
  const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
  if (claimsErr || !claimsData?.claims?.sub) {
    return jsonResponse(req, 401, { error: "Unauthorized" });
  }
  const userId = claimsData.claims.sub as string;
  const email = (claimsData.claims.email as string | undefined) ?? null;

  const supabase = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Verify admin role via the security-definer function.
  const { data: isAdmin, error: roleErr } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (roleErr || !isAdmin) return jsonResponse(req, 403, { error: "Forbidden" });

  const ip = clientIp(req);
  const key = `${rateLimitAction}:${userId}:${ip}`;
  const { data: allowed, error: rlErr } = await supabase.rpc("check_rate_limit", {
    _key: key,
    _max: rateMax,
    _window_seconds: rateWindowSeconds,
  });
  if (rlErr) {
    console.error("rate_limit_error", rlErr);
    return jsonResponse(req, 500, { error: "Server error" });
  }
  if (!allowed) return jsonResponse(req, 429, { error: "Too many requests" });

  return { supabase, userClient, userId, email, ip };
}

export async function audit(
  ctx: AdminContext,
  action: string,
  target_table: string | null,
  target_id: string | null,
  payload: unknown,
) {
  try {
    await ctx.supabase.from("admin_audit").insert({
      actor_id: ctx.userId,
      actor_email: ctx.email,
      action,
      target_table,
      target_id,
      payload: payload ?? null,
      ip: ctx.ip,
    });
  } catch (e) {
    console.error("audit_insert_failed", e);
  }
}
