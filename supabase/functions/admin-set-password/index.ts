import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// Super Admin only: approve a pending staff member (generating their password)
// or reset the password of an existing account. The plain password is returned
// exactly once so the Super Admin can hand it over securely.
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWER = "abcdefghijkmnopqrstuvwxyz";
const DIGIT = "23456789";
const SYMBOL = "@#$%&*!?";

function pick(set: string, n: number) {
  const out: string[] = [];
  const bytes = new Uint32Array(n);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < n; i++) out.push(set[bytes[i] % set.length]);
  return out;
}

function generatePassword(length = 12) {
  const chars = [
    ...pick(UPPER, 2),
    ...pick(LOWER, 4),
    ...pick(DIGIT, 3),
    ...pick(SYMBOL, 2),
    ...pick(UPPER + LOWER + DIGIT + SYMBOL, Math.max(0, length - 11)),
  ];
  const order = new Uint32Array(chars.length);
  crypto.getRandomValues(order);
  return chars
    .map((c, i) => ({ c, k: order[i] }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.c)
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    const caller = userData?.user;
    if (userErr || !caller) return json({ error: "Unauthorized" }, 401);

    const { data: callerRoles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);
    const isSuperAdmin = (callerRoles || []).some((r: any) => r.role === "super_admin");
    if (!isSuperAdmin) {
      return json({ error: "Only a Super Admin can manage passwords." }, 403);
    }

    const body = await req.json();
    const action = body?.action;
    const targetUserId = body?.user_id;
    if (!targetUserId || typeof targetUserId !== "string") {
      return json({ error: "user_id is required." }, 400);
    }
    if (action !== "approve" && action !== "reset") {
      return json({ error: "Invalid action." }, 400);
    }

    const password = generatePassword(12);
    const { error: pwErr } = await admin.auth.admin.updateUserById(targetUserId, {
      password,
      email_confirm: true,
    });
    if (pwErr) {
      console.error("updateUserById failed", pwErr);
      return json({ error: "Could not update the password." }, 400);
    }

    if (action === "approve") {
      await admin
        .from("profiles")
        .update({
          status: "active",
          approved_at: new Date().toISOString(),
          approved_by: caller.id,
          reactivated_at: new Date().toISOString(),
          reactivated_by: caller.id,
          exit_date: null,
          deactivated_at: null,
          is_reregistration: false,
        })
        .eq("user_id", targetUserId);
    }

    return json({ ok: true, password });
  } catch (e) {
    console.error("admin-set-password error", e);
    return json({ error: "Unexpected error." }, 500);
  }
});