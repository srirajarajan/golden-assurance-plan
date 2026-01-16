import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";
import fontkit from "https://esm.sh/@pdf-lib/fontkit@1.1.1";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GMAIL_USER = Deno.env.get("GMAIL_USER");
const GMAIL_PASS = Deno.env.get("GMAIL_APP_PASSWORD");

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
  selected_language?: string;
  language?: "ta" | "en" | string;
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
    if (!path || path.trim() === "") {
      console.log("Skipping image fetch for empty path");
      return null;
    }

    const { data, error } = await supabase.storage.from("applications-images").download(path);

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

function getLanguage(data: ApplicationData): "ta" | "en" {
  const v = (data.language ?? data.selected_language ?? "").toString().trim().toLowerCase();
  return v === "ta" || v === "tamil" ? "ta" : "en";
}

async function buildPdfBuffer(data: ApplicationData): Promise<Uint8Array> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const lang = getLanguage(data);
  const isTamil = lang === "ta";
  const labels = isTamil ? tamilLabels : englishLabels;
  const notProvided = labels.notProvided;

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  let primaryFont: any;
  if (isTamil) {
    try {
      const fontBytes = await Deno.readFile(new URL("./NotoSansTamil-Regular.ttf", import.meta.url));
      primaryFont = await pdfDoc.embedFont(fontBytes, { subset: true });
    } catch (e) {
      console.error("Failed to load Tamil font, falling back to Helvetica:", e);
      primaryFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }
  } else {
    primaryFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
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
  console.log("PDF generated successfully");

  return pdfBytes;
}

async function sendEmailWithPdf(pdfBuffer: Uint8Array): Promise<void> {
  if (!GMAIL_USER || !GMAIL_PASS) {
    throw new Error("GMAIL_USER or GMAIL_APP_PASSWORD is not configured");
  }

  console.log("Creating Gmail SMTP client...");
  console.log("GMAIL_USER:", GMAIL_USER);

  const client = new SMTPClient({
    connection: {
      hostname: "smtp.gmail.com",
      port: 465,
      tls: true,
      auth: {
        username: GMAIL_USER,
        password: GMAIL_PASS,
      },
    },
  });

  console.log("Sending email via Gmail SMTP...");

  const pdfBase64 = base64Encode(new Uint8Array(pdfBuffer).buffer as ArrayBuffer);

  await client.send({
    from: GMAIL_USER,
    to: "williamcareyfuneral99@gmail.com",
    subject: "New Funeral Insurance Application",
    content: "New application received. PDF attached.",
    attachments: [
      {
        filename: "William_Carey_Application.pdf",
        content: pdfBase64,
        encoding: "base64",
        contentType: "application/pdf",
      },
    ],
  });

  await client.close();

  console.log("Email sent successfully via Gmail SMTP");
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Received application submission request");
    const data: ApplicationData = await req.json();
    console.log("Form data received for:", data.member_name);

    const pdfBuffer = await buildPdfBuffer(data);
    console.log("PDF buffer size:", pdfBuffer.length);

    await sendEmailWithPdf(pdfBuffer);

    console.log("Application processed successfully");
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("generate-application-pdf error:", error?.message || String(error));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
