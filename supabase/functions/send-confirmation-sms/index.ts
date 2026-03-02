import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FAST2SMS_API_KEY = Deno.env.get("FAST2SMS_API_KEY");

serve(async (req: Request) => {
  console.log("=== SEND-CONFIRMATION-SMS STARTED ===");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mobile_number, serial_number } = await req.json();
    console.log("Mobile:", mobile_number, "Serial:", serial_number);

    if (!FAST2SMS_API_KEY) {
      console.error("FAST2SMS_API_KEY not configured");
      return new Response(JSON.stringify({ success: false, error: "SMS service not configured" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const cleanNumber = (mobile_number || "").replace(/\D/g, "").slice(-10);
    if (cleanNumber.length !== 10) {
      console.error("Invalid mobile number:", mobile_number);
      return new Response(JSON.stringify({ success: false, error: "Invalid 10-digit mobile number" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const message = "வில்லியம் கேரி ஈமச்சடங்கு காப்பீட்டு திட்டத்தில் இணைந்ததற்கு நன்றி - உங்கள் காப்பீட்டுத் தொகை ரூ.3,000 செலுத்திய விண்ணப்ப படிவம் ஆன்லைன் மூலம் வெற்றிகரமாக பதிவு செய்யப்பட்டுள்ளது.";

    console.log("Sending SMS via Fast2SMS to:", cleanNumber);

    const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: FAST2SMS_API_KEY,
      },
      body: JSON.stringify({
        route: "q",
        message: message,
        language: "unicode",
        flash: 0,
        numbers: cleanNumber,
      }),
    });

    const resData = await res.json();
    console.log("Fast2SMS response status:", res.status);
    console.log("Fast2SMS response:", JSON.stringify(resData));

    if (resData.return === true || resData.status_code === 200) {
      console.log("SMS sent successfully to:", cleanNumber);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const msg = resData.message || "SMS sending failed";
    console.error("SMS failed:", msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    console.error("SMS ERROR:", err);
    return new Response(JSON.stringify({ success: false, error: err?.message || String(err) }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
