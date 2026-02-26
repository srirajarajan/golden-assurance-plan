import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

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
  selected_language?: string;
  language?: "ta" | "en" | string;
  staff_email?: string;
  applicant_photo_path: string;
  aadhaar_front_path: string;
  aadhaar_back_path: string;
  pamphlet_image_path: string;
  user_id: string;
  serial_number?: string;
}

const tamilLabels = {
  title: "William Carey Funeral Insurance",
  subtitle: "Application Form / விண்ணப்பப் படிவம்",
  applicantPhoto: "Applicant Photo / விண்ணப்பதாரர் புகைப்படம்",
  applicantDetails: "Applicant Details / விண்ணப்பதாரர் விவரங்கள்",
  memberName: "Member Name / உறுப்பினர் பெயர்",
  guardianName: "Father/Husband Name / தகப்பனார்/கணவர் பெயர்",
  gender: "Gender / பாலினம்",
  occupation: "Occupation / தொழில்",
  rationCard: "Ration Card Number / குடும்ப அட்டை எண்",
  annualIncome: "Annual Income / ஆண்டு வருமானம்",
  aadhaarNumber: "Aadhaar Number / ஆதார் எண்",
  mobileNumber: "Mobile Number / கைபேசி எண்",
  address: "Permanent Address / நிரந்தர முகவரி",
  aadhaarImages: "Aadhaar Card Images / ஆதார் அட்டை படங்கள்",
  aadhaarFront: "Aadhaar Front Side / ஆதார் முன்பக்கம்",
  aadhaarBack: "Aadhaar Back Side / ஆதார் பின்பக்கம்",
  pamphletImage: "Pamphlet Image / துண்டுப்பிரசுரம்",
  nominee1Title: "Nominee 1 (Required) / வாரிசு 1 (கட்டாயம்)",
  nominee2Title: "Nominee 2 (Optional) / வாரிசு 2 (விருப்பம்)",
  nomineeName: "Nominee Name / வாரிசு பெயர்",
  nomineeGender: "Gender / பாலினம்",
  nomineeAge: "Age / வயது",
  nomineeRelation: "Relationship / உறவு முறை",
  additionalMessage: "Additional Message / கூடுதல் செய்தி",
  notProvided: "Not Provided",
};

const englishLabels = {
  title: "William Carey Funeral Insurance",
  subtitle: "Application Form",
  applicantPhoto: "Applicant Photo",
  applicantDetails: "Applicant Details",
  memberName: "Member Name",
  guardianName: "Father/Husband Name",
  gender: "Gender",
  occupation: "Occupation",
  rationCard: "Ration Card Number",
  annualIncome: "Annual Income (Max ₹1.75 Lakhs)",
  aadhaarNumber: "Aadhaar Number (12 digits)",
  mobileNumber: "Mobile Number",
  address: "Permanent Address",
  aadhaarImages: "Aadhaar Card Images",
  aadhaarFront: "Aadhaar Front Side",
  aadhaarBack: "Aadhaar Back Side",
  pamphletImage: "Pamphlet Image",
  nominee1Title: "Nominee 1 (Required)",
  nominee2Title: "Nominee 2 (Optional)",
  nomineeName: "Nominee Name",
  nomineeGender: "Gender",
  nomineeAge: "Age",
  nomineeRelation: "Relationship",
  additionalMessage: "Additional Message",
  notProvided: "Not Provided",
};

function safeText(v: unknown, fallback: string): string {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length > 0 ? s : fallback;
}

async function fetchImageAsBase64(supabase: any, path: string): Promise<{ base64: string; type: string } | null> {
  try {
    if (!path || path.trim() === "") return null;
    console.log("Fetching image:", path);
    const { data, error } = await supabase.storage.from("applications-images").download(path);
    if (error) { console.error(`Failed to download image (${path}):`, error.message); return null; }
    const arrayBuffer = await data.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    console.log("Image fetched successfully:", path, "size:", bytes.length);
    const isPng = bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
    const type = isPng ? "PNG" : "JPEG";
    const chunkSize = 0x8000;
    let binary = "";
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.slice(i, i + chunkSize));
    }
    const base64 = btoa(binary);
    return { base64, type };
  } catch (err) { console.error(`Error fetching image (${path}):`, err); return null; }
}

function getLanguage(data: ApplicationData): "ta" | "en" {
  const v = (data.language ?? data.selected_language ?? "").toString().trim().toLowerCase();
  return v === "ta" || v === "tamil" ? "ta" : "en";
}

async function buildPdfBuffer(data: ApplicationData): Promise<Uint8Array> {
  console.log("PDF GENERATION START");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const lang = getLanguage(data);
  const isTamil = lang === "ta";
  const labels = isTamil ? tamilLabels : englishLabels;
  const notProvided = labels.notProvided;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = 210;
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  // Skip custom font loading (causes stack overflow in Deno), use helvetica
  doc.setFont("helvetica", "normal");

  const drawSectionHeader = (title: string) => {
    doc.setFillColor(139, 90, 43);
    doc.rect(margin, y, contentWidth, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(title, margin + 3, y + 5.5);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    y += 12;
  };

  const drawField = (label: string, value: string) => {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(label + ":", margin + 2, y);
    doc.setFont("helvetica", "normal");
    const labelWidth = 55;
    const valueWidth = contentWidth - labelWidth - 5;
    const lines = doc.splitTextToSize(value, valueWidth);
    doc.text(lines, margin + labelWidth, y);
    y += Math.max(6, lines.length * 5);
  };

  const drawTableRow = (cells: string[], colWidths: number[], isHeader = false) => {
    const rowHeight = 7;
    let x = margin;
    if (isHeader) {
      doc.setFillColor(218, 165, 32);
      doc.rect(margin, y, contentWidth, rowHeight, "F");
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
    } else {
      doc.setFillColor(255, 250, 240);
      doc.rect(margin, y, contentWidth, rowHeight, "F");
      doc.setFont("helvetica", "normal");
    }
    doc.setFontSize(8);
    cells.forEach((cell, i) => { doc.text(cell, x + 2, y + 5); x += colWidths[i]; });
    doc.setDrawColor(139, 90, 43);
    doc.rect(margin, y, contentWidth, rowHeight, "S");
    x = margin;
    colWidths.slice(0, -1).forEach((w) => { x += w; doc.line(x, y, x, y + rowHeight); });
    y += rowHeight;
    doc.setTextColor(0, 0, 0);
  };

  // Title
  doc.setFillColor(139, 90, 43);
  doc.rect(0, 0, pageWidth, 25, "F");
  doc.setTextColor(255, 215, 0);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(labels.title, pageWidth / 2, 10, { align: "center" });
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(labels.subtitle, pageWidth / 2, 18, { align: "center" });
  doc.setTextColor(0, 0, 0);
  y = 30;

  if (data.serial_number) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`Serial No: ${data.serial_number}`, pageWidth - margin, y, { align: "right" });
    y += 7;
  }

  // Applicant Photo
  drawSectionHeader(labels.applicantPhoto);
  const applicantPhoto = await fetchImageAsBase64(supabase, data.applicant_photo_path);
  if (applicantPhoto) {
    try { doc.addImage(applicantPhoto.base64, applicantPhoto.type, margin + 2, y, 35, 45); y += 50; }
    catch (e) { console.error("Error adding applicant photo:", e); y += 5; }
  } else { doc.setFontSize(9); doc.text("Photo not available", margin + 2, y + 5); y += 10; }
  y += 5;

  // Applicant Details
  drawSectionHeader(labels.applicantDetails);
  drawField(labels.memberName, safeText(data.member_name, notProvided));
  drawField(labels.guardianName, safeText(data.guardian_name, notProvided));
  drawField(labels.gender, safeText(data.gender, notProvided));
  drawField(labels.occupation, safeText(data.occupation, notProvided));
  drawField(labels.rationCard, safeText(data.ration_card, notProvided));
  drawField(labels.annualIncome, safeText(data.annual_income, notProvided));
  drawField(labels.aadhaarNumber, safeText(data.aadhaar_number, notProvided));
  drawField(labels.mobileNumber, safeText(data.mobile_number, notProvided));
  drawField(labels.address, safeText(data.address, notProvided));
  y += 5;

  // Aadhaar Images
  drawSectionHeader(labels.aadhaarImages);
  const aadhaarFront = await fetchImageAsBase64(supabase, data.aadhaar_front_path);
  doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text(labels.aadhaarFront + ":", margin + 2, y); y += 5;
  if (aadhaarFront) {
    try { doc.addImage(aadhaarFront.base64, aadhaarFront.type, margin + 2, y, 80, 50); y += 55; }
    catch (e) { doc.setFont("helvetica", "normal"); doc.text("Image not available", margin + 2, y); y += 8; }
  } else { doc.setFont("helvetica", "normal"); doc.text("Image not available", margin + 2, y); y += 8; }

  const aadhaarBack = await fetchImageAsBase64(supabase, data.aadhaar_back_path);
  doc.setFont("helvetica", "bold");
  doc.text(labels.aadhaarBack + ":", margin + 2, y); y += 5;
  if (aadhaarBack) {
    try { doc.addImage(aadhaarBack.base64, aadhaarBack.type, margin + 2, y, 80, 50); y += 55; }
    catch (e) { doc.setFont("helvetica", "normal"); doc.text("Image not available", margin + 2, y); y += 8; }
  } else { doc.setFont("helvetica", "normal"); doc.text("Image not available", margin + 2, y); y += 8; }

  // Page 2
  doc.addPage(); y = margin;

  // Pamphlet
  drawSectionHeader(labels.pamphletImage);
  const pamphletImage = await fetchImageAsBase64(supabase, data.pamphlet_image_path);
  if (pamphletImage) {
    try { doc.addImage(pamphletImage.base64, pamphletImage.type, margin + 2, y, 100, 70); y += 75; }
    catch (e) { doc.setFontSize(9); doc.text("Image not available", margin + 2, y + 5); y += 10; }
  } else { doc.setFontSize(9); doc.text("Image not available", margin + 2, y + 5); y += 10; }
  y += 5;

  // Nominees
  const nomineeColWidths = [45, 45, 30, 60];
  drawSectionHeader(labels.nominee1Title);
  drawTableRow([labels.nomineeName, labels.nomineeGender, labels.nomineeAge, labels.nomineeRelation], nomineeColWidths, true);
  drawTableRow([safeText(data.nominee1_name, notProvided), safeText(data.nominee1_gender, notProvided), safeText(data.nominee1_age, notProvided), safeText(data.nominee1_relation, notProvided)], nomineeColWidths);
  y += 8;

  drawSectionHeader(labels.nominee2Title);
  const hasNominee2 = safeText(data.nominee2_name, "") !== "";
  drawTableRow([labels.nomineeName, labels.nomineeGender, labels.nomineeAge, labels.nomineeRelation], nomineeColWidths, true);
  if (hasNominee2) {
    drawTableRow([safeText(data.nominee2_name, notProvided), safeText(data.nominee2_gender, notProvided), safeText(data.nominee2_age, notProvided), safeText(data.nominee2_relation, notProvided)], nomineeColWidths);
  } else {
    drawTableRow([notProvided, notProvided, notProvided, notProvided], nomineeColWidths);
  }
  y += 8;

  // Additional message
  const additionalMessage = safeText(data.additional_message, "");
  if (additionalMessage && additionalMessage !== notProvided && additionalMessage.length > 0) {
    drawSectionHeader(labels.additionalMessage);
    doc.setFontSize(9); doc.setFont("helvetica", "normal");
    const messageLines = doc.splitTextToSize(additionalMessage, contentWidth - 4);
    doc.text(messageLines, margin + 2, y);
    y += messageLines.length * 5 + 5;
  }

  const pdfArrayBuffer = doc.output("arraybuffer");
  const pdfBytes = new Uint8Array(pdfArrayBuffer);
  console.log("PDF GENERATED SUCCESSFULLY, size:", pdfBytes.length, "bytes");
  return pdfBytes;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(i, i + chunkSize));
  }
  return btoa(binary);
}

async function sendEmailWithPdf(pdfBuffer: Uint8Array, fullName: string, serialNumber?: string): Promise<{ ok: boolean; error?: string }> {
  console.log("EMAIL SEND START via Resend API");
  console.log("RESEND_API_KEY:", RESEND_API_KEY ? "SET" : "NOT SET");

  if (!RESEND_API_KEY) {
    const msg = "Email service not configured. Contact developer.";
    console.error(msg);
    return { ok: false, error: msg };
  }

  const safeName = serialNumber || (fullName || "Application").toString().trim().replace(/[\\/:*?"<>|]+/g, "_");
  const filename = serialNumber ? `${serialNumber}.pdf` : `Application_${safeName}.pdf`;
  const submissionDate = new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });

  const pdfBase64 = uint8ArrayToBase64(pdfBuffer);

  const emailPayload = {
    from: "William Carey Funeral Insurance <onboarding@resend.dev>",
    to: ["williamcareyfuneral99@gmail.com"],
    subject: "New Application Received – William Carey Funeral Insurance",
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#8B5A2B">New Application Received</h2>
      <p>A new application has been submitted successfully.</p>
      <table style="border-collapse:collapse;width:100%;margin:16px 0">
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Serial Number</td><td style="padding:8px;border:1px solid #ddd">${serialNumber || "N/A"}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Applicant Name</td><td style="padding:8px;border:1px solid #ddd">${fullName || "N/A"}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Submission Date</td><td style="padding:8px;border:1px solid #ddd">${submissionDate}</td></tr>
      </table>
      <p>Please see the attached PDF for full details.</p>
      <hr style="border:none;border-top:1px solid #ddd;margin:20px 0"/>
      <p style="color:#888;font-size:12px">William Carey Funeral Insurance</p>
    </div>`,
    attachments: [
      {
        filename,
        content: pdfBase64,
      },
    ],
  };

  try {
    console.log("Sending email via Resend to: williamcareyfuneral99@gmail.com");
    console.log("Attachment filename:", filename);

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailPayload),
    });

    const resendData = await resendRes.json();
    console.log("Resend API response status:", resendRes.status);
    console.log("Resend API response body:", JSON.stringify(resendData));

    if (!resendRes.ok) {
      const msg = `Resend API error: ${resendData?.message || resendRes.statusText}`;
      console.error(msg);
      return { ok: false, error: msg };
    }

    console.log("Email sent successfully via Resend, id:", resendData.id);
    return { ok: true };
  } catch (err: any) {
    const msg = `Failed to send email via Resend: ${err?.message || String(err)}`;
    console.error(msg);
    return { ok: false, error: "Email service not configured. Contact developer." };
  }
}

const handler = async (req: Request): Promise<Response> => {
  console.log("=== FUNCTION STARTED ===");
  console.log("Request method:", req.method);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: ApplicationData = await req.json();
    console.log("Member name:", data.member_name);
    console.log("Serial number:", data.serial_number);

    const pdfBuffer = await buildPdfBuffer(data);
    console.log("PDF buffer created, size:", pdfBuffer.length);

    const emailResult = await sendEmailWithPdf(pdfBuffer, data.member_name, data.serial_number);

    if (emailResult.ok) {
      console.log("Email sent successfully");
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.error("Email failed:", emailResult.error);
    return new Response(JSON.stringify({ success: false, error: emailResult.error }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    console.error("ERROR:", err);
    return new Response(JSON.stringify({ success: false, error: err?.message || String(err) }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
