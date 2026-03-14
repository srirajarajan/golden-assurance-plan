import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface ApplicationData {
  member_name: string;
  age: string;
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
  payment_method?: string;
  selected_language?: string;
  language?: "ta" | "en" | string;
  staff_email?: string;
  applicant_photo_path: string;
  aadhaar_front_path: string;
  aadhaar_back_path: string;
  pamphlet_image_path: string;
  user_id: string;
  serial_number: string;
}

const tamilLabels = {
  title: "William Carey Funeral Insurance",
  subtitle: "விண்ணப்பப் படிவம்",
  applicationNo: "விண்ணப்ப எண்",
  date: "தேதி",
  applicantPhoto: "விண்ணப்பதாரர் புகைப்படம்",
  applicantDetails: "விண்ணப்பதாரர் விவரங்கள்",
  memberName: "உறுப்பினர் பெயர்",
  age: "வயது",
  guardianName: "தகப்பனார்/கணவர் பெயர்",
  gender: "பாலினம்",
  occupation: "தொழில்",
  rationCard: "குடும்ப அட்டை எண்",
  annualIncome: "ஆண்டு வருமானம்",
  aadhaarNumber: "ஆதார் எண்",
  mobileNumber: "கைபேசி எண்",
  address: "நிரந்தர முகவரி",
  aadhaarImages: "ஆதார் அட்டை படங்கள்",
  aadhaarFront: "ஆதார் முன்பக்கம்",
  aadhaarBack: "ஆதார் பின்பக்கம்",
  pamphletImage: "துண்டுப்பிரசுரம்",
  nomineeDetails: "வாரிசு விவரங்கள்",
  nominee1Title: "வாரிசு 1",
  nominee2Title: "வாரிசு 2",
  nomineeName: "வாரிசு பெயர்",
  nomineeGender: "பாலினம்",
  nomineeAge: "வயது",
  nomineeRelation: "உறவு முறை",
  additionalMessage: "கூடுதல் செய்தி",
  notProvided: "வழங்கப்படவில்லை",
  footer: "இது கணினி மூலம் உருவாக்கப்பட்ட காப்பீட்டு விண்ணப்ப ஆவணம்.",
  managingDirector: "நிர்வாக இயக்குநர்",
  paymentMethod: "செலுத்தும் முறை",
  cash: "பணம்",
  upi: "UPI",
};

const englishLabels = {
  title: "William Carey Funeral Insurance",
  subtitle: "Application Form",
  applicationNo: "Application No",
  date: "Date",
  applicantPhoto: "Applicant Photo",
  applicantDetails: "APPLICANT DETAILS",
  memberName: "Member Name",
  age: "Age",
  guardianName: "Father/Husband Name",
  gender: "Gender",
  occupation: "Occupation",
  rationCard: "Ration Card Number",
  annualIncome: "Annual Income",
  aadhaarNumber: "Aadhaar Number",
  mobileNumber: "Mobile Number",
  address: "Permanent Address",
  aadhaarImages: "AADHAAR CARD IMAGES",
  aadhaarFront: "Aadhaar Front Side",
  aadhaarBack: "Aadhaar Back Side",
  pamphletImage: "PAMPHLET IMAGE",
  nomineeDetails: "NOMINEE DETAILS",
  nominee1Title: "Nominee 1",
  nominee2Title: "Nominee 2",
  nomineeName: "Nominee Name",
  nomineeGender: "Gender",
  nomineeAge: "Age",
  nomineeRelation: "Relationship",
  additionalMessage: "ADDITIONAL MESSAGE",
  notProvided: "Not Provided",
  footer: "This is a system-generated insurance application document.",
  managingDirector: "Managing Director",
  paymentMethod: "Payment Method",
  cash: "Cash",
  upi: "UPI",
};

function safeText(v: unknown, fallback: string): string {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length > 0 ? s : fallback;
}

function getLanguage(data: ApplicationData): "ta" | "en" {
  const v = (data.language ?? data.selected_language ?? "").toString().trim().toLowerCase();
  return v === "ta" || v === "tamil" ? "ta" : "en";
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(i, i + chunkSize));
  }
  return btoa(binary);
}

async function fetchImageAsBase64(supabase: any, path: string): Promise<{ base64: string; type: string } | null> {
  try {
    if (!path || path.trim() === "") return null;
    const { data, error } = await supabase.storage.from("applications-images").download(path);
    if (error) { console.error(`Failed to download image (${path}):`, error.message); return null; }
    const arrayBuffer = await data.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const isPng = bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50;
    const type = isPng ? "PNG" : "JPEG";
    return { base64: uint8ArrayToBase64(bytes), type };
  } catch (err) { console.error(`Error fetching image (${path}):`, err); return null; }
}

async function loadImageFromUrl(url: string): Promise<{ base64: string; type: string } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) { console.error(`Failed to fetch image from ${url}: ${res.statusText}`); return null; }
    const arrayBuffer = await res.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const isPng = bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50;
    const type = isPng ? "PNG" : "JPEG";
    return { base64: uint8ArrayToBase64(bytes), type };
  } catch (err) {
    console.error(`Failed to load image from URL ${url}:`, err);
    return null;
  }
}

async function loadTamilFont(): Promise<string | null> {
  try {
    const fontPath = new URL("./NotoSansTamil-Regular.ttf", import.meta.url);
    const fontBytes = await Deno.readFile(fontPath);
    return base64Encode(fontBytes);
  } catch (err) {
    console.error("Failed to load Tamil font:", err);
    return null;
  }
}

// ─── Colors ───
const DARK_BROWN = [62, 39, 22] as const;   // #3E2716
const GOLD = [164, 127, 55] as const;       // #A47F37
const LIGHT_GREY_BG = [245, 245, 245] as const;
const MID_GREY = [200, 200, 200] as const;
const TEXT_BLACK = [33, 33, 33] as const;
const TEXT_GREY = [130, 130, 130] as const;
const WHITE = [255, 255, 255] as const;

async function buildPdfBuffer(data: ApplicationData): Promise<Uint8Array> {
  console.log("PDF GENERATION START");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const lang = getLanguage(data);
  const isTamil = lang === "ta";
  const labels = isTamil ? tamilLabels : englishLabels;
  const np = labels.notProvided;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = 210;
  const margin = 15;
  const cw = pw - 2 * margin;
  let y = margin;

  // Font setup
  let fontFamily = "helvetica";
  if (isTamil) {
    const tamilFontB64 = await loadTamilFont();
    if (tamilFontB64) {
      try {
        doc.addFileToVFS("NotoSansTamil-Regular.ttf", tamilFontB64);
        doc.addFont("NotoSansTamil-Regular.ttf", "NotoSansTamil", "normal");
        fontFamily = "NotoSansTamil";
      } catch (e) { console.error("Font registration failed:", e); }
    }
  }
  doc.setFont(fontFamily, "normal");

  const submissionDate = new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });

  const pageBottom = 280; // usable bottom
  const footerY = 290;

  // Helper: ensure page break — compact threshold
  const ensureSpace = (needed: number) => {
    if (y + needed > pageBottom) { doc.addPage(); y = margin; }
  };

  // ═══════════════════════════════════════════
  // PAGE 1 - HEADER
  // ═══════════════════════════════════════════
  doc.setFontSize(14);
  doc.setFont(fontFamily, "bold");
  doc.setTextColor(...DARK_BROWN);
  doc.text(labels.title, margin, y + 5);
  doc.setFontSize(10);
  doc.setFont(fontFamily, "normal");
  doc.setTextColor(...GOLD);
  doc.text(labels.subtitle, margin, y + 11);

  doc.setFontSize(9);
  doc.setTextColor(...TEXT_BLACK);
  doc.setFont(fontFamily, "bold");
  doc.text(`${labels.applicationNo}: ${data.serial_number}`, pw - margin, y + 5, { align: "right" });
  doc.setFont(fontFamily, "normal");
  doc.text(`${labels.date}: ${submissionDate}`, pw - margin, y + 11, { align: "right" });
  y += 14;

  // Divider
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pw - margin, y);
  y += 6;

  // ═══════════════════════════════════════════
  // APPLICANT PHOTO — top-right container
  // ═══════════════════════════════════════════
  const photoW = 34; // ~95px
  const photoH = 42; // ~120px
  const photoMarginRight = 2;
  const photoMarginTop = 15;
  const photoX = pw - margin - photoW - photoMarginRight;
  const photoY = y + photoMarginTop;
  const applicantPhoto = await fetchImageAsBase64(supabase, data.applicant_photo_path);
  if (applicantPhoto) {
    try {
      doc.setDrawColor(153, 153, 153);
      doc.setLineWidth(0.3);
      doc.rect(photoX - 0.5, photoY - 0.5, photoW + 1, photoH + 1, "S");
      doc.addImage(applicantPhoto.base64, applicantPhoto.type, photoX, photoY, photoW, photoH);
    } catch (e) { console.error("Photo error:", e); }
  }

  // ═══════════════════════════════════════════
  // APPLICANT DETAILS
  // ═══════════════════════════════════════════
  const drawSectionHeader = (title: string) => {
    ensureSpace(10);
    doc.setFillColor(...LIGHT_GREY_BG);
    doc.setDrawColor(...MID_GREY);
    doc.setLineWidth(0.3);
    doc.rect(margin, y, cw, 7, "FD");
    doc.setFont(fontFamily, "bold");
    doc.setFontSize(9);
    doc.setTextColor(...DARK_BROWN);
    doc.text(title, margin + 3, y + 5);
    doc.setTextColor(...TEXT_BLACK);
    y += 9;
  };

  drawSectionHeader(labels.applicantDetails);

  const detailFields = [
    [labels.memberName, safeText(data.member_name, np)],
    [labels.age, safeText(data.age, np)],
    [labels.guardianName, safeText(data.guardian_name, np)],
    [labels.gender, safeText(data.gender, np)],
    [labels.occupation, safeText(data.occupation, np)],
    [labels.rationCard, safeText(data.ration_card, np)],
    [labels.annualIncome, safeText(data.annual_income, np)],
    [labels.aadhaarNumber, safeText(data.aadhaar_number, np)],
    [labels.mobileNumber, safeText(data.mobile_number, np)],
    [labels.address, safeText(data.address, np)],
  ];

  const labelColW = 48;
  const rowH = 6.5;
  const detailsMaxW = applicantPhoto ? (photoX - margin - 3) : cw;

  detailFields.forEach(([label, value], idx) => {
    ensureSpace(rowH + 1);
    const fillColor = idx % 2 === 0 ? WHITE : LIGHT_GREY_BG;
    doc.setFillColor(...fillColor);
    doc.rect(margin, y, detailsMaxW, rowH, "F");
    doc.setDrawColor(...MID_GREY);
    doc.setLineWidth(0.15);
    doc.line(margin, y + rowH, margin + detailsMaxW, y + rowH);

    doc.setFont(fontFamily, "bold");
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_BLACK);
    doc.text(label, margin + 3, y + 4.5);

    doc.setFont(fontFamily, "normal");
    const valMaxW = detailsMaxW - labelColW - 4;
    const lines = doc.splitTextToSize(value, valMaxW);
    doc.text(lines, margin + labelColW, y + 4.5);

    const lineH = Math.max(rowH, lines.length * 4.5 + 2);
    y += lineH;
  });

  y += 5;

  // ═══════════════════════════════════════════
  // NOMINEE DETAILS — on Page 1, right after applicant details
  // ═══════════════════════════════════════════
  drawSectionHeader(labels.nomineeDetails);

  const drawNomineeBlock = (title: string, name: string, relation: string, gender: string, age: string) => {
    ensureSpace(30);
    doc.setFont(fontFamily, "bold");
    doc.setFontSize(8);
    doc.setTextColor(...GOLD);
    doc.text(title, margin + 2, y);
    y += 4;

    const nomFields = [
      [labels.nomineeName, safeText(name, np)],
      [labels.nomineeRelation, safeText(relation, np)],
      [labels.nomineeGender, safeText(gender, np)],
      [labels.nomineeAge, safeText(age, np)],
    ];

    nomFields.forEach(([label, value], idx) => {
      const fillColor = idx % 2 === 0 ? WHITE : LIGHT_GREY_BG;
      doc.setFillColor(...fillColor);
      doc.rect(margin, y, cw, rowH, "F");
      doc.setDrawColor(...MID_GREY);
      doc.setLineWidth(0.15);
      doc.line(margin, y + rowH, pw - margin, y + rowH);

      doc.setFont(fontFamily, "bold");
      doc.setFontSize(8);
      doc.setTextColor(...TEXT_BLACK);
      doc.text(label, margin + 3, y + 4.5);

      doc.setFont(fontFamily, "normal");
      doc.text(value, margin + labelColW, y + 4.5);
      y += rowH;
    });
    y += 2;
  };

  drawNomineeBlock(labels.nominee1Title, data.nominee1_name, data.nominee1_relation, data.nominee1_gender, data.nominee1_age);
  drawNomineeBlock(labels.nominee2Title, data.nominee2_name, data.nominee2_relation, data.nominee2_gender, data.nominee2_age);

  // ═══════════════════════════════════════════
  // PAYMENT METHOD
  // ═══════════════════════════════════════════
  drawSectionHeader(labels.paymentMethod);

  const paymentVal = (data.payment_method || "").trim().toLowerCase();
  const isCash = paymentVal === "cash" || paymentVal === "பணம்";
  const isUpi = paymentVal === "upi";

  const cashCheck = isCash ? "☑" : "☐";
  const upiCheck = isUpi ? "☑" : "☐";

  doc.setFont(fontFamily, "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_BLACK);
  doc.text(`${cashCheck} ${labels.cash}     ${upiCheck} ${labels.upi}`, margin + 3, y + 1);
  y += 8;

  // ═══════════════════════════════════════════
  // AADHAAR IMAGES
  // ═══════════════════════════════════════════
  drawSectionHeader(labels.aadhaarImages);

  const imgBoxW = (cw - 8) / 2;
  const imgBoxH = 50;

  const aadhaarFront = await fetchImageAsBase64(supabase, data.aadhaar_front_path);
  const aadhaarBack = await fetchImageAsBase64(supabase, data.aadhaar_back_path);

  ensureSpace(imgBoxH + 10);

  doc.setFont(fontFamily, "bold");
  doc.setFontSize(7);
  doc.setTextColor(...TEXT_GREY);
  doc.text(labels.aadhaarFront, margin + imgBoxW / 2, y, { align: "center" });
  doc.text(labels.aadhaarBack, margin + imgBoxW + 8 + imgBoxW / 2, y, { align: "center" });
  y += 3;

  doc.setDrawColor(...MID_GREY);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, imgBoxW, imgBoxH, "S");
  doc.rect(margin + imgBoxW + 8, y, imgBoxW, imgBoxH, "S");

  if (aadhaarFront) {
    try { doc.addImage(aadhaarFront.base64, aadhaarFront.type, margin + 2, y + 2, imgBoxW - 4, imgBoxH - 4); }
    catch (e) { console.error("Aadhaar front error:", e); }
  }
  if (aadhaarBack) {
    try { doc.addImage(aadhaarBack.base64, aadhaarBack.type, margin + imgBoxW + 10, y + 2, imgBoxW - 4, imgBoxH - 4); }
    catch (e) { console.error("Aadhaar back error:", e); }
  }

  y += imgBoxH + 5;

  // ═══════════════════════════════════════════
  // ADDITIONAL MESSAGE (still on page 1 if space)
  // ═══════════════════════════════════════════
  const msg = safeText(data.additional_message, "");
  if (msg.length > 0) {
    drawSectionHeader(labels.additionalMessage);
    doc.setFontSize(8);
    doc.setFont(fontFamily, "normal");
    doc.setTextColor(...TEXT_BLACK);
    const msgLines = doc.splitTextToSize(msg, cw - 6);
    ensureSpace(msgLines.length * 4.5 + 4);
    doc.text(msgLines, margin + 3, y);
    y += msgLines.length * 4.5 + 5;
  }

  // ═══════════════════════════════════════════
  // PAGE 2 — Pamphlet + Seal/Signature
  // ═══════════════════════════════════════════
  doc.addPage();
  y = margin;

  // Pamphlet image — fills most of page 2
  const pamphletImage = await fetchImageAsBase64(supabase, data.pamphlet_image_path);

  // Merged seal-signature image setup
  const baseUrl = Deno.env.get("SUPABASE_URL")!;
  const sealSignImg = await loadImageFromUrl(`${baseUrl}/storage/v1/object/public/pdf-assets/seal-signature.png`);

  if (!sealSignImg) console.error("Seal-signature image not found");

  const sealSignW = 60;   // ~170px
  let sealSignImgH = 50;

  if (sealSignImg) {
    try {
      const props = doc.getImageProperties(`data:image/${sealSignImg.type.toLowerCase()};base64,${sealSignImg.base64}`);
      sealSignImgH = sealSignW * (props.height / props.width);
    } catch (_) {}
  }

  const bottomMargin = 10.5; // ~30px from page bottom
  const totalBlockH = sealSignImgH + 2;

  // Available space for pamphlet on page 2
  const sigBlockStartY = 297 - bottomMargin - totalBlockH; // A4 height = 297mm
  const pamphletAvailH = sigBlockStartY - margin - 5; // leave 5mm gap before sig block

  if (pamphletImage) {
    const pamphletMaxW = cw;
    try {
      const imgProps = doc.getImageProperties(`data:image/${pamphletImage.type.toLowerCase()};base64,${pamphletImage.base64}`);
      const aspectRatio = imgProps.height / imgProps.width;
      const calcH = pamphletMaxW * aspectRatio;
      const finalH = Math.min(calcH, pamphletAvailH);
      const finalW = finalH < calcH ? finalH / aspectRatio : pamphletMaxW;

      // Center the image horizontally
      const imgX = margin + (cw - finalW) / 2;

      doc.addImage(pamphletImage.base64, pamphletImage.type, imgX, y, finalW, finalH);
      y += finalH + 5;
    } catch (e) {
      console.error("Pamphlet error:", e);
    }
  }

  // Seal-Signature — bottom-right of page 2
  const rightMarginPx = 14; // ~40px
  const blockRightX = pw - margin - rightMarginPx;
  let sigY = sigBlockStartY;

  const imgX = blockRightX - sealSignW;

  if (sealSignImg) {
    try { doc.addImage(sealSignImg.base64, sealSignImg.type, imgX, sigY, sealSignW, sealSignImgH); }
    catch (e) { console.error("Seal-signature image error:", e); }
  }

  // ═══════════════════════════════════════════
  // FOOTER on every page
  // ═══════════════════════════════════════════
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont(fontFamily, "normal");
    doc.setFontSize(7);
    doc.setTextColor(...TEXT_GREY);
    doc.text(labels.footer, pw / 2, footerY, { align: "center" });
  }

  const pdfBytes = new Uint8Array(doc.output("arraybuffer"));
  console.log("PDF GENERATED SUCCESSFULLY, size:", pdfBytes.length, "bytes, pages:", totalPages);
  return pdfBytes;
}

// ─── Email ───
async function sendEmailWithPdf(pdfBuffer: Uint8Array, fullName: string, serialNumber: string): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_API_KEY) return { ok: false, error: "Email service not configured. Contact developer." };

  const filename = `${serialNumber}.pdf`;
  const submissionDate = new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
  const pdfBase64 = uint8ArrayToBase64(pdfBuffer);

  const emailPayload = {
    from: "William Carey Funeral Insurance <onboarding@resend.dev>",
    to: ["williamcareyfuneral99@gmail.com"],
    subject: `New Application Received - ${serialNumber}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#3E2716">New Application Received</h2>
      <p>A new application has been submitted.</p>
      <table style="border-collapse:collapse;width:100%;margin:16px 0">
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Serial Number</td><td style="padding:8px;border:1px solid #ddd">${serialNumber}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Applicant Name</td><td style="padding:8px;border:1px solid #ddd">${fullName || "N/A"}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Submission Date</td><td style="padding:8px;border:1px solid #ddd">${submissionDate}</td></tr>
      </table>
      <p>Please see the attached PDF for full details.</p>
      <hr style="border:none;border-top:1px solid #ddd;margin:20px 0"/>
      <p style="color:#888;font-size:12px">William Carey Funeral Insurance</p>
    </div>`,
    attachments: [{ filename, content: pdfBase64 }],
  };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify(emailPayload),
    });
    const resData = await res.json();
    if (!res.ok) return { ok: false, error: `Resend API error: ${resData?.message || res.statusText}` };
    console.log("Email sent, id:", resData.id);
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: "Email service error. Contact developer." };
  }
}

// ─── Handler ───
serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const data: ApplicationData = await req.json();
    console.log("Member:", data.member_name, "Serial:", data.serial_number);

    if (!data.serial_number) {
      return new Response(JSON.stringify({ success: false, error: "Serial number is required" }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const pdfBuffer = await buildPdfBuffer(data);
    const emailResult = await sendEmailWithPdf(pdfBuffer, data.member_name, data.serial_number);

    if (!emailResult.ok) {
      console.error("Email failed:", emailResult.error);
      return new Response(JSON.stringify({ success: false, error: emailResult.error }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    console.error("ERROR:", err);
    return new Response(JSON.stringify({ success: false, error: err?.message || String(err) }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
