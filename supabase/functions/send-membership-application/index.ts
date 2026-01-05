import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const GMAIL_USER = Deno.env.get("GMAIL_USER");
const GMAIL_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD");
const SEAL_BASE64 = Deno.env.get("WILLIAM_CAREY_SEAL_BASE64");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ApplicationData {
  applicant_name: string;
  guardian_name: string;
  gender: string;
  occupation: string;
  ration_card: string;
  annual_income: string;
  aadhaar: string;
  address: string;
  phone: string;
  nominee1_name: string;
  nominee1_gender: string;
  nominee1_age: string;
  nominee1_relation: string;
  nominee2_name: string;
  nominee2_gender: string;
  nominee2_age: string;
  nominee2_relation: string;
  language?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate SMTP credentials
    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      console.error("Gmail SMTP credentials not configured");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Email service not configured" 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const data: ApplicationData = await req.json();
    console.log("Received membership application data:", {
      applicant_name: data.applicant_name,
      phone: data.phone,
      language: data.language
    });

    // Format gender display (bilingual for email)
    const getGenderLabel = (gender: string) => {
      switch (gender) {
        case 'male': return 'Male / ஆண்';
        case 'female': return 'Female / பெண்';
        case 'other': return 'Other / மற்றவை';
        default: return gender || 'Not specified';
      }
    };

    // Format income display (bilingual for email)
    const getIncomeLabel = (income: string) => {
      switch (income) {
        case 'below_175000': return 'Below ₹1.75 Lakhs / ₹1.75 லட்சத்திற்கு கீழ்';
        case 'above_175000': return 'Above ₹1.75 Lakhs / ₹1.75 லட்சத்திற்கு மேல்';
        default: return income || 'Not specified';
      }
    };

    // Build nominees HTML
    let nomineesHtml = '';
    if (data.nominee1_name) {
      nomineesHtml += `
        <tr>
          <td style="border: 1px solid #ddd; padding: 12px;">1</td>
          <td style="border: 1px solid #ddd; padding: 12px;">${data.nominee1_name}</td>
          <td style="border: 1px solid #ddd; padding: 12px;">${getGenderLabel(data.nominee1_gender)}</td>
          <td style="border: 1px solid #ddd; padding: 12px;">${data.nominee1_age || '-'}</td>
          <td style="border: 1px solid #ddd; padding: 12px;">${data.nominee1_relation || '-'}</td>
        </tr>
      `;
    }
    if (data.nominee2_name) {
      nomineesHtml += `
        <tr>
          <td style="border: 1px solid #ddd; padding: 12px;">2</td>
          <td style="border: 1px solid #ddd; padding: 12px;">${data.nominee2_name}</td>
          <td style="border: 1px solid #ddd; padding: 12px;">${getGenderLabel(data.nominee2_gender)}</td>
          <td style="border: 1px solid #ddd; padding: 12px;">${data.nominee2_age || '-'}</td>
          <td style="border: 1px solid #ddd; padding: 12px;">${data.nominee2_relation || '-'}</td>
        </tr>
      `;
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Membership Application</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #8B4513; margin-bottom: 5px;">William Carey Funeral Insurance</h1>
            <h2 style="color: #666; font-weight: normal; margin-top: 0;">New Membership Application</h2>
          </div>
          
          <h3 style="color: #8B4513; border-bottom: 2px solid #D4AF37; padding-bottom: 10px;">
            Applicant Details / விண்ணப்பதாரர் விவரங்கள்
          </h3>
          <table style="border-collapse: collapse; width: 100%; margin-bottom: 30px;">
            <tr style="background-color: #f9f9f9;">
              <td style="border: 1px solid #ddd; padding: 12px; font-weight: bold; width: 40%;">Member Name / உறுப்பினர் பெயர்</td>
              <td style="border: 1px solid #ddd; padding: 12px;">${data.applicant_name || '-'}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 12px; font-weight: bold;">Father/Husband Name / தகப்பனார் / கணவர் பெயர்</td>
              <td style="border: 1px solid #ddd; padding: 12px;">${data.guardian_name || '-'}</td>
            </tr>
            <tr style="background-color: #f9f9f9;">
              <td style="border: 1px solid #ddd; padding: 12px; font-weight: bold;">Gender / பாலினம்</td>
              <td style="border: 1px solid #ddd; padding: 12px;">${getGenderLabel(data.gender)}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 12px; font-weight: bold;">Occupation / தொழில்</td>
              <td style="border: 1px solid #ddd; padding: 12px;">${data.occupation || '-'}</td>
            </tr>
            <tr style="background-color: #f9f9f9;">
              <td style="border: 1px solid #ddd; padding: 12px; font-weight: bold;">Mobile Number / செல்</td>
              <td style="border: 1px solid #ddd; padding: 12px;">${data.phone || '-'}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 12px; font-weight: bold;">Ration Card No. / குடும்ப அட்டை எண்</td>
              <td style="border: 1px solid #ddd; padding: 12px;">${data.ration_card || '-'}</td>
            </tr>
            <tr style="background-color: #f9f9f9;">
              <td style="border: 1px solid #ddd; padding: 12px; font-weight: bold;">Annual Income / ஆண்டு வருமானம்</td>
              <td style="border: 1px solid #ddd; padding: 12px;">${getIncomeLabel(data.annual_income)}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 12px; font-weight: bold;">Aadhaar No. / ஆதார் அட்டை எண்</td>
              <td style="border: 1px solid #ddd; padding: 12px;">${data.aadhaar || '-'}</td>
            </tr>
            <tr style="background-color: #f9f9f9;">
              <td style="border: 1px solid #ddd; padding: 12px; font-weight: bold;">Permanent Address / நிரந்தர முகவரி</td>
              <td style="border: 1px solid #ddd; padding: 12px;">${data.address || '-'}</td>
            </tr>
          </table>

          ${nomineesHtml ? `
          <h3 style="color: #8B4513; border-bottom: 2px solid #D4AF37; padding-bottom: 10px;">
            Nominee Details / வாரிசு விவரங்கள்
          </h3>
          <table style="border-collapse: collapse; width: 100%; margin-bottom: 30px;">
            <tr style="background-color: #8B4513; color: white;">
              <th style="border: 1px solid #ddd; padding: 12px;">No.</th>
              <th style="border: 1px solid #ddd; padding: 12px;">Name / பெயர்</th>
              <th style="border: 1px solid #ddd; padding: 12px;">Gender / பாலினம்</th>
              <th style="border: 1px solid #ddd; padding: 12px;">Age / வயது</th>
              <th style="border: 1px solid #ddd; padding: 12px;">Relationship / உறவு முறை</th>
            </tr>
            ${nomineesHtml}
          </table>
          ` : ''}

          <div style="text-align: center; margin-top: 40px; padding: 20px; background-color: #f9f5f0; border-radius: 10px; border: 1px solid #D4AF37;">
            <p style="font-weight: bold; color: #8B4513; margin-bottom: 10px;">
              Authorized by Director – William Carey Funeral Insurance
            </p>
            <p style="color: #666; font-size: 14px;">
              இயக்குநரால் அங்கீகரிக்கப்பட்டது – வில்லியம் கேரி ஈமச்சடங்கு காப்பீடு
            </p>
            <p style="color: #888; font-size: 12px; margin-top: 10px;">
              (Official Seal attached / அதிகாரப்பூர்வ முத்திரை இணைக்கப்பட்டுள்ளது)
            </p>
          </div>

          <p style="margin-top: 30px; color: #888; font-size: 12px; text-align: center;">
            This application was submitted through the William Carey Funeral Insurance website.<br>
            இந்த விண்ணப்பம் வில்லியம் கேரி ஈமச்சடங்கு காப்பீடு இணையதளம் மூலம் சமர்ப்பிக்கப்பட்டது.
          </p>
        </div>
      </body>
      </html>
    `;

    console.log("Preparing to send email via Gmail SMTP to williamcareyfuneral99@gmail.com...");

    // Create SMTP client for Gmail
    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 587,
        tls: true,
        auth: {
          username: GMAIL_USER,
          password: GMAIL_APP_PASSWORD,
        },
      },
    });

    try {
      // Prepare email content
      const emailConfig: any = {
        from: `William Carey Funeral Insurance <${GMAIL_USER}>`,
        to: "williamcareyfuneral99@gmail.com",
        subject: "New Membership Application – William Carey",
        html: emailHtml,
      };

      // Add seal attachment if available
      if (SEAL_BASE64 && SEAL_BASE64.length > 100) {
        emailConfig.attachments = [
          {
            filename: "official-seal.jpg",
            content: SEAL_BASE64,
            encoding: "base64",
            contentType: "image/jpeg",
          }
        ];
        console.log("Seal attachment added from environment variable");
      } else {
        console.log("No seal attachment available (environment variable not set or empty)");
      }

      console.log("Sending email via Gmail SMTP...");
      await client.send(emailConfig);
      await client.close();
      
      console.log("Email sent successfully via Gmail SMTP!");

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Application received and email sent",
        emailSent: true 
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });

    } catch (smtpError: any) {
      console.error("Gmail SMTP error:", smtpError.message);
      try {
        await client.close();
      } catch (_) {
        // Ignore close errors
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to send email",
          details: smtpError.message 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

  } catch (error: any) {
    console.error("Error in send-membership-application function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Failed to process application",
        details: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
