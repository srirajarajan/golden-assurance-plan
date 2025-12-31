import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");



const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ApplicationData {
  memberName: string;
  fatherName: string;
  gender: string;
  occupation: string;
  phone: string;
  rationCard: string;
  annualIncome: string;
  aadharCard: string;
  address: string;
  nominees: Array<{
    name: string;
    gender: string;
    age: string;
    relation: string;
  }>;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: ApplicationData = await req.json();
    console.log("Received application data:", data);

    const nomineesHtml = data.nominees
      .filter(n => n.name)
      .map((n, i) => `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">${i + 1}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${n.name}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${n.gender}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${n.age}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${n.relation}</td>
        </tr>
      `).join('');

    const emailHtml = `
      <h1 style="color: #8B4513;">New Application - William Carey Funeral Insurance</h1>
      
      <h2>Personal Details</h2>
      <table style="border-collapse: collapse; width: 100%;">
        <tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Member Name</td><td style="border: 1px solid #ddd; padding: 8px;">${data.memberName}</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Father/Husband Name</td><td style="border: 1px solid #ddd; padding: 8px;">${data.fatherName}</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Gender</td><td style="border: 1px solid #ddd; padding: 8px;">${data.gender}</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Occupation</td><td style="border: 1px solid #ddd; padding: 8px;">${data.occupation}</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Phone</td><td style="border: 1px solid #ddd; padding: 8px;">${data.phone}</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Ration Card No.</td><td style="border: 1px solid #ddd; padding: 8px;">${data.rationCard}</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Annual Income</td><td style="border: 1px solid #ddd; padding: 8px;">${data.annualIncome}</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Aadhar Card No.</td><td style="border: 1px solid #ddd; padding: 8px;">${data.aadharCard}</td></tr>
        <tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Address</td><td style="border: 1px solid #ddd; padding: 8px;">${data.address}</td></tr>
      </table>

      ${nomineesHtml ? `
      <h2>Nominee Details</h2>
      <table style="border-collapse: collapse; width: 100%;">
        <tr style="background-color: #f2f2f2;">
          <th style="border: 1px solid #ddd; padding: 8px;">No.</th>
          <th style="border: 1px solid #ddd; padding: 8px;">Name</th>
          <th style="border: 1px solid #ddd; padding: 8px;">Gender</th>
          <th style="border: 1px solid #ddd; padding: 8px;">Age</th>
          <th style="border: 1px solid #ddd; padding: 8px;">Relation</th>
        </tr>
        ${nomineesHtml}
      </table>
      ` : ''}

      <p style="margin-top: 20px; color: #666;">This application was submitted through the William Carey Funeral Insurance website.</p>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "William Carey Insurance <onboarding@resend.dev>",
        to: ["williamcareyfuneral99@gmail.com"],
        subject: "New Insurance Application Received",
        html: emailHtml,
      }),
    });

    const emailResult = await emailResponse.json();

    console.log("Email sent successfully:", emailResult);

    if (!emailResponse.ok) {
      throw new Error(emailResult.message || "Failed to send email");
    }

    return new Response(JSON.stringify({ success: true, emailResult }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-application function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
