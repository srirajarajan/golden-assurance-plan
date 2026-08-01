import { createClient } from "npm:@supabase/supabase-js@2";
Deno.serve(async (req) => {
  if (req.headers.get("x-reset-key") !== Deno.env.get("PROD_RESET_KEY")) return new Response("no", { status: 401 });
  const { user_id } = await req.json();
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  await admin.from("user_roles").delete().eq("user_id", user_id);
  await admin.from("profiles").delete().eq("user_id", user_id);
  const { error } = await admin.auth.admin.deleteUser(user_id);
  return new Response(JSON.stringify({ ok: !error, error: error?.message }), { headers: { "Content-Type": "application/json" } });
});
