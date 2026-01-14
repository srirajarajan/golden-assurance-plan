import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";
import fontkit from "https://esm.sh/@pdf-lib/fontkit@1.1.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface ApplicationData {
  member_name: string;
  guardian_name: string;
  gender: string;
  occupation: string;
  ration_card: string;
  annual_income: string;
  aadhaar_number: string;
  mobile_number: string;
  address: string;
  nominee1_name: string;
  nominee1_gender: string;
  nominee1_age: string;
  nominee1_relation: string;
  nominee2_name: string;
  nominee2_gender: string;
  nominee2_age: string;
  nominee2_relation: string;
  additional_message: string;
  selected_language: string;
  applicant_photo_path: string;
  aadhaar_front_path: string;
  aadhaar_back_path: string;
  pamphlet_image_path: string;
  user_id: string;
}

const tamilLabels = {
  title: "William Carey Funeral Insurance",
  subtitle: "இறுதிச்சடங்கு காப்பீடு விண்ணப்பம்",
  applicantDetails: "விண்ணப்பதாரர் விவரங்கள்",
  memberName: "உறுப்பினர் பெயர்",
  guardianName: "தகப்பனார் / கணவர் பெயர்",
  gender: "பாலினம்",
  occupation: "தொழில்",
  rationCard: "குடும்ப அட்டை எண்",
  annualIncome: "ஆண்டு வருமானம்",
  aadhaarNumber: "ஆதார் எண்",
  mobileNumber: "கைபேசி எண்",
  address: "நிரந்தர முகவரி",
  nominee1Title: "வாரிசு 1",
  nominee2Title: "வாரிசு 2",
  nomineeName: "பெயர்",
  nomineeAge: "வயது",
  nomineeRelation: "உறவு முறை",
  additionalMessage: "கூடுதல் செய்தி",
  applicantPhoto: "விண்ணப்பதாரர் புகைப்படம்",
  aadhaarFront: "ஆதார் முன்பக்கம்",
  aadhaarBack: "ஆதார் பின்பக்கம்",
  pamphletImage: "துண்டுப்பிரசுரம்",
  notProvided: "வழங்கப்படவில்லை",
};

const englishLabels = {
  title: "William Carey Funeral Insurance",
  subtitle: "Funeral Insurance Application",
  applicantDetails: "Applicant Details",
  memberName: "Member Name",
  guardianName: "Father/Husband Name",
  gender: "Gender",
  occupation: "Occupation",
  rationCard: "Ration Card Number",
  annualIncome: "Annual Income",
  aadhaarNumber: "Aadhaar Number",
  mobileNumber: "Mobile Number",
  address: "Permanent Address",
  nominee1Title: "Nominee 1",
  nominee2Title: "Nominee 2",
  nomineeName: "Name",
  nomineeAge: "Age",
  nomineeRelation: "Relation",
  additionalMessage: "Additional Message",
  applicantPhoto: "Applicant Photo",
  aadhaarFront: "Aadhaar Front",
  aadhaarBack: "Aadhaar Back",
  pamphletImage: "Pamphlet Image",
  notProvided: "Not Provided",
};

function safeText(v: unknown, fallback: string): string {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length > 0 ? s : fallback;
}

async function fetchImageAsBytes(supabase: any, path: string): Promise<Uint8Array | null> {
  try {
    if (!path || path === "Not Provided" || path.trim() === "") {
      console.log(`Skipping image fetch for empty path`);
      return null;
    }

    const { data, error } = await supabase.storage
      .from("applications-images")
      .download(path);

    if (error) {
      console.error(`Failed to download image (${path}):`, error.message);
      return null;
    }

    const arrayBuffer = await data.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (err) {
    console.error(`Error fetching image (${path}):`, err);
    return null;
  }
}

async function embedImage(pdfDoc: PDFDocument, imageBytes: Uint8Array): Promise<any> {
  try {
    const isPng =
      imageBytes.length > 8 &&
      imageBytes[0] === 0x89 &&
      imageBytes[1] === 0x50 &&
      imageBytes[2] === 0x4e &&
      imageBytes[3] === 0x47;

    return isPng ? await pdfDoc.embedPng(imageBytes) : await pdfDoc.embedJpg(imageBytes);
  } catch (err) {
    console.error("Error embedding image:", err);
    return null;
  }
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function generatePdfAndSendEmail(data: ApplicationData): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting PDF generation for user:", data.user_id);

    const isTamil = data.selected_language === "ta" || data.selected_language === "Tamil";
    const labels = isTamil ? tamilLabels : englishLabels;
    const notProvided = labels.notProvided;

    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    let primaryFont: any;

    if (isTamil) {
      try {
        const fontBytes = await Deno.readFile(new URL("./NotoSansTamil-Regular.ttf", import.meta.url));
        primaryFont = await pdfDoc.embedFont(fontBytes, { subset: true });
        console.log("Tamil font loaded successfully");
      } catch (fontErr) {
        console.error("Failed to load Tamil font, using Helvetica:", fontErr);
        primaryFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      }
    } else {
      primaryFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      console.log("English font (Helvetica) loaded");
    }

    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 50;
    const lineHeight = 18;

    const page1 = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    const drawText = (text: string, x: number, yPos: number, options: any = {}) => {
      const { size = 11, color = rgb(0, 0, 0) } = options;
      try {
        page1.drawText(text, { x, y: yPos, size, font: primaryFont, color });
      } catch (e) {
        console.error("Error drawing text:", text, e);
      }
    };

    const drawLine = (yPos: number) => {
      page1.drawLine({
        start: { x: margin, y: yPos },
        end: { x: pageWidth - margin, y: yPos },
        thickness: 1,
        color: rgb(0.7, 0.7, 0.7),
      });
    };

    drawText(labels.title, margin, y, { size: 18, color: rgb(0.4, 0.2, 0.1) });
    y -= 25;
    drawText(labels.subtitle, margin, y, { size: 14, color: rgb(0.5, 0.3, 0.15) });
    y -= 30;
    drawLine(y);
    y -= 25;

    const applicantPhotoBytes = await fetchImageAsBytes(supabase, data.applicant_photo_path);
    if (applicantPhotoBytes) {
      const applicantPhotoImage = await embedImage(pdfDoc, applicantPhotoBytes);
      if (applicantPhotoImage) {
        page1.drawImage(applicantPhotoImage, {
          x: pageWidth - margin - 100,
          y: y - 100,
          width: 100,
          height: 120,
        });
      }
    }

    drawText(labels.applicantDetails, margin, y, { size: 13, color: rgb(0.2, 0.4, 0.6) });
    y -= lineHeight + 5;

    const fields: Array<[string, string]> = [
      [labels.memberName, safeText(data.member_name, notProvided)],
      [labels.guardianName, safeText(data.guardian_name, notProvided)],
      [labels.gender, safeText(data.gender, notProvided)],
      [labels.occupation, safeText(data.occupation, notProvided)],
      [labels.rationCard, safeText(data.ration_card, notProvided)],
      [labels.annualIncome, safeText(data.annual_income, notProvided)],
      [labels.aadhaarNumber, safeText(data.aadhaar_number, notProvided)],
      [labels.mobileNumber, safeText(data.mobile_number, notProvided)],
      [labels.address, safeText(data.address, notProvided)],
    ];

    for (const [label, value] of fields) {
      drawText(`${label}:`, margin, y, { size: 10 });
      drawText(String(value), margin + 150, y, { size: 10 });
      y -= lineHeight;
    }

    y -= 10;
    drawLine(y);
    y -= 20;

    drawText(labels.nominee1Title, margin, y, { size: 13, color: rgb(0.2, 0.4, 0.6) });
    y -= lineHeight + 5;

    const nominee1Fields: Array<[string, string]> = [
      [labels.nomineeName, safeText(data.nominee1_name, notProvided)],
      [labels.gender, safeText(data.nominee1_gender, notProvided)],
      [labels.nomineeAge, safeText(data.nominee1_age, notProvided)],
      [labels.nomineeRelation, safeText(data.nominee1_relation, notProvided)],
    ];

    for (const [label, value] of nominee1Fields) {
      drawText(`${label}:`, margin, y, { size: 10 });
      drawText(String(value), margin + 150, y, { size: 10 });
      y -= lineHeight;
    }

    y -= 10;

    drawText(labels.nominee2Title, margin, y, { size: 13, color: rgb(0.2, 0.4, 0.6) });
    y -= lineHeight + 5;

    const nominee2Fields: Array<[string, string]> = [
      [labels.nomineeName, safeText(data.nominee2_name, notProvided)],
      [labels.gender, safeText(data.nominee2_gender, notProvided)],
      [labels.nomineeAge, safeText(data.nominee2_age, notProvided)],
      [labels.nomineeRelation, safeText(data.nominee2_relation, notProvided)],
    ];

    for (const [label, value] of nominee2Fields) {
      drawText(`${label}:`, margin, y, { size: 10 });
      drawText(String(value), margin + 150, y, { size: 10 });
      y -= lineHeight;
    }

    y -= 10;
    drawLine(y);
    y -= 20;

    const additionalMessage = safeText(data.additional_message, "");
    if (additionalMessage && additionalMessage !== notProvided) {
      drawText(`${labels.additionalMessage}:`, margin, y, { size: 10 });
      y -= lineHeight;
      drawText(additionalMessage, margin, y, { size: 10 });
    }

    const page2 = pdfDoc.addPage([pageWidth, pageHeight]);
    let imgY = pageHeight - margin;

    const drawImageTitle = (title: string, yPos: number) => {
      try {
        page2.drawText(title, {
          x: margin,
          y: yPos,
          size: 12,
          font: primaryFont,
          color: rgb(0.2, 0.4, 0.6),
        });
      } catch (e) {
        console.error("Error drawing image title:", e);
      }
    };

    const aadhaarFrontBytes = await fetchImageAsBytes(supabase, data.aadhaar_front_path);
    if (aadhaarFrontBytes) {
      drawImageTitle(labels.aadhaarFront, imgY);
      imgY -= 20;
      const aadhaarFrontImage = await embedImage(pdfDoc, aadhaarFrontBytes);
      if (aadhaarFrontImage) {
        page2.drawImage(aadhaarFrontImage, {
          x: margin,
          y: imgY - 160,
          width: 250,
          height: 160,
        });
      }
      imgY -= 180;
    }

    const aadhaarBackBytes = await fetchImageAsBytes(supabase, data.aadhaar_back_path);
    if (aadhaarBackBytes) {
      drawImageTitle(labels.aadhaarBack, imgY);
      imgY -= 20;
      const aadhaarBackImage = await embedImage(pdfDoc, aadhaarBackBytes);
      if (aadhaarBackImage) {
        page2.drawImage(aadhaarBackImage, {
          x: margin,
          y: imgY - 160,
          width: 250,
          height: 160,
        });
      }
      imgY -= 180;
    }

    const pamphletBytes = await fetchImageAsBytes(supabase, data.pamphlet_image_path);
    if (pamphletBytes) {
      drawImageTitle(labels.pamphletImage, imgY);
      imgY -= 20;
      const pamphletImage = await embedImage(pdfDoc, pamphletBytes);
      if (pamphletImage) {
        page2.drawImage(pamphletImage, {
          x: margin,
          y: imgY - 180,
          width: 250,
          height: 180,
        });
      }
    }

    const pdfBytes = await pdfDoc.save();
    console.log("PDF generated successfully, size:", pdfBytes.length, "bytes");

    const pdfBase64 = uint8ArrayToBase64(pdfBytes);
    console.log("PDF converted to base64, length:", pdfBase64.length);

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      return;
    }

    const memberName = safeText(data.member_name, "Applicant");
    const mobileNumber = safeText(data.mobile_number, "Not Provided");
    const languageDisplay = isTamil ? "Tamil" : "English";

    const emailPayload = {
      from: "William Carey Insurance <onboarding@resend.dev>",
      to: ["williamcareyfuneral99@gmail.com"],
      subject: `New Funeral Insurance Application - ${memberName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4a2c1a; border-bottom: 2px solid #d4a574; padding-bottom: 10px;">
            New Funeral Insurance Application
          </h1>
          <div style="background: #f9f6f3; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Member Name:</strong> ${memberName}</p>
            <p><strong>Mobile Number:</strong> ${mobileNumber}</p>
            <p><strong>Form Language:</strong> ${languageDisplay}</p>
          </div>
          <p style="color: #666;">
            Please find the complete application form attached as a PDF document.
          </p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            This is an automated message from William Carey Funeral Insurance System.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `William_Carey_Application_${memberName.replace(/\s+/g, "_")}.pdf`,
          content: pdfBase64,
        },
      ],
    };

    console.log("Sending email with PDF attachment...");

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailPayload),
    });

    const emailResult = await emailResponse.json();

    if (emailResponse.ok) {
      console.log("Email sent successfully:", emailResult);
    } else {
      console.error("Email sending failed:", emailResult);
    }
  } catch (error: any) {
    console.error("Error in generatePdfAndSendEmail:", error?.message || String(error));
  }
}

declare const EdgeRuntime: {
  waitUntil(promise: Promise<unknown>): void;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: ApplicationData = await req.json();

    console.log("Received application request:", {
      user_id: data.user_id,
      member_name: data.member_name,
      language: data.selected_language,
    });

    EdgeRuntime.waitUntil(generatePdfAndSendEmail(data));

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Application received successfully. PDF will be generated and emailed." 
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  } catch (error: any) {
    console.error("Error parsing request:", error?.message || String(error));

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Application received." 
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
};

serve(handler);
