import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// Public endpoint: staff submit a registration request.
// No password is ever chosen by the user — the Super Admin assigns one on approval.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const { email, full_name, phone_number, district } = await req.json();

    if (!email || typeof email !== "string" || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return json({ error: "A valid email address is required." }, 400);
    }
    if (!full_name || String(full_name).trim().length < 2) {
      return json({ error: "Full name is required." }, 400);
    }
    if (!/^\d{10}$/.test(String(phone_number || ""))) {
      return json({ error: "A valid 10-digit mobile number is required." }, 400);
    }
    if (!district || String(district).trim().length < 2) {
      return json({ error: "District is required." }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const normalizedEmail = email.trim().toLowerCase();

    // Does a profile already exist for this email? (re-registration path)
    const { data: existing } = await admin
      .from("profiles")
      .select("user_id, status")
      .ilike("email", normalizedEmail)
      .maybeSingle();

    const profilePayload = {
      full_name: String(full_name).trim(),
      phone_number: String(phone_number),
      district: String(district).trim(),
      status: "pending" as const,
      exit_date: null,
      deactivated_at: null,
      approved_at: null,
      approved_by: null,
    };

    if (existing) {
      if (existing.status === "active") {
        // Already an active account — do not leak details, ask them to sign in.
        return json({ ok: true, reregistration: false });
      }
      // Terminated / rejected / pending: raise a fresh pending approval request.
      const { error: updErr } = await admin
        .from("profiles")
        .update({ ...profilePayload, is_reregistration: true })
        .eq("user_id", existing.user_id);
      if (updErr) throw updErr;

      // Invalidate any old password so the account cannot be used before approval.
      await admin.auth.admin.updateUserById(existing.user_id, {
        password: crypto.randomUUID() + crypto.randomUUID(),
      });

      return json({ ok: true, reregistration: true });
    }

    // Brand new account — created with an unknown random password.
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: normalizedEmail,
      password: crypto.randomUUID() + crypto.randomUUID(),
      email_confirm: true,
      user_metadata: {
        full_name: profilePayload.full_name,
        phone_number: profilePayload.phone_number,
        district: profilePayload.district,
      },
    });
    if (createErr) {
      console.error("createUser failed", createErr);
      return json({ error: "Registration could not be completed. Please try again." }, 400);
    }

    // Ensure the pending profile exists and is complete (works with or without the signup trigger).
    if (created?.user?.id) {
      await admin
        .from("profiles")
        .upsert(
          { user_id: created.user.id, email: normalizedEmail, ...profilePayload },
          { onConflict: "user_id" },
        );
    }

    return json({ ok: true, reregistration: false });
  } catch (e) {
    console.error("staff-register error", e);
    return json({ error: "Registration could not be completed. Please try again." }, 500);
  }
});