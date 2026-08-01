import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// One-time production reset: wipes all test data and leaves only the two
// permanent Super Admin accounts. Protected by PROD_RESET_KEY.
const SUPER_ADMINS = [
  { email: "srirajasundar1@gmail.com", password: "akshu.S05", full_name: "Super Admin" },
  { email: "williamcareyfuneral99@gmail.com", password: "Williamcarey@99", full_name: "William Carey Super Admin" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  const key = req.headers.get("x-reset-key");
  if (!key || key !== Deno.env.get("PROD_RESET_KEY")) return json({ error: "Unauthorized" }, 401);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const log: string[] = [];

  // 1. Wipe transactional data
  for (const table of ["applications", "invoices"]) {
    const { error } = await admin.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    log.push(`${table}: ${error ? error.message : "cleared"}`);
  }

  // 2. Wipe stored application files
  for (const bucket of ["applications-pdf", "applications-images", "applications", "applicant-photos"]) {
    try {
      const { data: files } = await admin.storage.from(bucket).list("", { limit: 1000 });
      const paths: string[] = [];
      for (const f of files || []) {
        if (f.id === null) {
          const { data: nested } = await admin.storage.from(bucket).list(f.name, { limit: 1000 });
          (nested || []).forEach((n) => paths.push(`${f.name}/${n.name}`));
        } else {
          paths.push(f.name);
        }
      }
      if (paths.length) await admin.storage.from(bucket).remove(paths);
      log.push(`${bucket}: removed ${paths.length} files`);
    } catch (e) {
      log.push(`${bucket}: ${String(e)}`);
    }
  }

  // 3. Remove every auth user except the two Super Admins
  const keep = SUPER_ADMINS.map((s) => s.email.toLowerCase());
  let page = 1;
  const toDelete: string[] = [];
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) break;
    const users = data?.users || [];
    users.forEach((u) => {
      if (!keep.includes((u.email || "").toLowerCase())) toDelete.push(u.id);
    });
    if (users.length < 200) break;
    page++;
  }
  for (const id of toDelete) {
    await admin.from("user_roles").delete().eq("user_id", id);
    await admin.from("profiles").delete().eq("user_id", id);
    await admin.auth.admin.deleteUser(id);
  }
  log.push(`deleted ${toDelete.length} users`);

  // 4. Ensure the two Super Admin accounts exist, active, with the given passwords
  for (const sa of SUPER_ADMINS) {
    let userId: string | null = null;
    const { data: prof } = await admin
      .from("profiles")
      .select("user_id")
      .ilike("email", sa.email)
      .maybeSingle();
    if (prof) userId = prof.user_id;

    if (!userId) {
      let p = 1;
      while (!userId) {
        const { data, error } = await admin.auth.admin.listUsers({ page: p, perPage: 200 });
        if (error) break;
        const found = (data?.users || []).find(
          (u) => (u.email || "").toLowerCase() === sa.email.toLowerCase(),
        );
        if (found) userId = found.id;
        if ((data?.users || []).length < 200) break;
        p++;
      }
    }

    if (userId) {
      await admin.auth.admin.updateUserById(userId, { password: sa.password, email_confirm: true });
    } else {
      const { data: created, error } = await admin.auth.admin.createUser({
        email: sa.email,
        password: sa.password,
        email_confirm: true,
        user_metadata: { full_name: sa.full_name },
      });
      if (error) {
        log.push(`${sa.email}: ${error.message}`);
        continue;
      }
      userId = created.user!.id;
    }

    await admin.from("profiles").upsert(
      {
        user_id: userId,
        email: sa.email,
        full_name: sa.full_name,
        status: "active",
        range_start: 1,
        range_end: 99999,
        approved_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    await admin.from("user_roles").delete().eq("user_id", userId);
    await admin.from("user_roles").insert([
      { user_id: userId, role: "super_admin" },
      { user_id: userId, role: "admin" },
    ]);
    log.push(`${sa.email}: super admin ready`);
  }

  return json({ ok: true, log });
});