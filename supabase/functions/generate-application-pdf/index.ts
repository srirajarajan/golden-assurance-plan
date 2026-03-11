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

  // Helper: ensure page break
  const ensureSpace = (needed: number) => {
    if (y + needed > 282) { doc.addPage(); y = margin; }
  };

  // ═══════════════════════════════════════════
  // PAGE 1 - HEADER
  // ═══════════════════════════════════════════

  // Top left: Company name + subtitle
  doc.setFontSize(14);
  doc.setFont(fontFamily, "bold");
  doc.setTextColor(...DARK_BROWN);
  doc.text(labels.title, margin, y + 5);
  doc.setFontSize(10);
  doc.setFont(fontFamily, "normal");
  doc.setTextColor(...GOLD);
  doc.text(labels.subtitle, margin, y + 11);

  // Top right: Application No + Date
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_BLACK);
  doc.setFont(fontFamily, "bold");
  doc.text(`${labels.applicationNo}: ${data.serial_number}`, pw - margin, y + 5, { align: "right" });
  doc.setFont(fontFamily, "normal");
  doc.text(`${labels.date}: ${submissionDate}`, pw - margin, y + 11, { align: "right" });

  y += 16;

  // Divider line
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pw - margin, y);
  y += 8;

  // ═══════════════════════════════════════════
  // APPLICANT PHOTO
  // ═══════════════════════════════════════════
  // Applicant photo - dedicated container, top-right, no overlap
  const photoW = 34; // ~95px
  const photoH = 42; // ~120px
  const photoMarginRight = 6; // moved right +15px (less margin = more right)
  const photoMarginTop = 12; // moved down +15px
  const photoX = pw - margin - photoW - photoMarginRight;
  const photoY = y + photoMarginTop;
  const applicantPhoto = await fetchImageAsBase64(supabase, data.applicant_photo_path);
  if (applicantPhoto) {
    try {
      // Border around photo
      doc.setDrawColor(153, 153, 153);
      doc.setLineWidth(0.3);
      doc.rect(photoX - 0.5, photoY - 0.5, photoW + 1, photoH + 1, "S");
      doc.addImage(applicantPhoto.base64, applicantPhoto.type, photoX, photoY, photoW, photoH);
    } catch (e) { console.error("Photo error:", e); }
  }

  // ═══════════════════════════════════════════
  // APPLICANT DETAILS SECTION
  // ═══════════════════════════════════════════
  // Section header
  const drawSectionHeader = (title: string) => {
    ensureSpace(12);
    doc.setFillColor(...LIGHT_GREY_BG);
    doc.setDrawColor(...MID_GREY);
    doc.setLineWidth(0.3);
    doc.rect(margin, y, cw, 8, "FD");
    doc.setFont(fontFamily, "bold");
    doc.setFontSize(10);
    doc.setTextColor(...DARK_BROWN);
    doc.text(title, margin + 4, y + 5.5);
    doc.setTextColor(...TEXT_BLACK);
    y += 12;
  };

  drawSectionHeader(labels.applicantDetails);

  // Two-column table for details
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

  const labelColW = 50;
  const valueColW = cw - labelColW;
  const rowH = 7;

  // Limit detail rows width so they don't overlap photo container
  const detailsMaxW = applicantPhoto ? (photoX - margin - 3) : cw;

  detailFields.forEach(([label, value], idx) => {
    ensureSpace(rowH + 2);
    const fillColor = idx % 2 === 0 ? WHITE : LIGHT_GREY_BG;
    doc.setFillColor(...fillColor);
    doc.rect(margin, y, detailsMaxW, rowH, "F");
    // Bottom border
    doc.setDrawColor(...MID_GREY);
    doc.setLineWidth(0.15);
    doc.line(margin, y + rowH, margin + detailsMaxW, y + rowH);

    doc.setFont(fontFamily, "bold");
    doc.setFontSize(9);
    doc.setTextColor(...TEXT_BLACK);
    doc.text(label, margin + 3, y + 5);

    doc.setFont(fontFamily, "normal");
    const valMaxW = detailsMaxW - labelColW - 6;
    const lines = doc.splitTextToSize(value, valMaxW);
    doc.text(lines, margin + labelColW, y + 5);

    const lineH = Math.max(rowH, lines.length * 5 + 3);
    y += lineH;
  });

  y += 8;

  // ═══════════════════════════════════════════
  // AADHAAR IMAGES
  // ═══════════════════════════════════════════
  drawSectionHeader(labels.aadhaarImages);

  const imgBoxW = (cw - 10) / 2;
  const imgBoxH = 55;

  const aadhaarFront = await fetchImageAsBase64(supabase, data.aadhaar_front_path);
  const aadhaarBack = await fetchImageAsBase64(supabase, data.aadhaar_back_path);

  ensureSpace(imgBoxH + 12);

  // Labels
  doc.setFont(fontFamily, "bold");
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_GREY);
  doc.text(labels.aadhaarFront, margin + imgBoxW / 2, y, { align: "center" });
  doc.text(labels.aadhaarBack, margin + imgBoxW + 10 + imgBoxW / 2, y, { align: "center" });
  y += 4;

  // Bordered boxes
  doc.setDrawColor(...MID_GREY);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, imgBoxW, imgBoxH, "S");
  doc.rect(margin + imgBoxW + 10, y, imgBoxW, imgBoxH, "S");

  if (aadhaarFront) {
    try { doc.addImage(aadhaarFront.base64, aadhaarFront.type, margin + 2, y + 2, imgBoxW - 4, imgBoxH - 4); }
    catch (e) { console.error("Aadhaar front error:", e); }
  }
  if (aadhaarBack) {
    try { doc.addImage(aadhaarBack.base64, aadhaarBack.type, margin + imgBoxW + 12, y + 2, imgBoxW - 4, imgBoxH - 4); }
    catch (e) { console.error("Aadhaar back error:", e); }
  }

  y += imgBoxH + 8;

  // ═══════════════════════════════════════════
  // PAGE 2
  // ═══════════════════════════════════════════
  doc.addPage();
  y = margin;

  // ═══════════════════════════════════════════
  // PAMPHLET IMAGE
  // ═══════════════════════════════════════════
  drawSectionHeader(labels.pamphletImage);
  const pamphletImage = await fetchImageAsBase64(supabase, data.pamphlet_image_path);
  if (pamphletImage) {
    // Use natural aspect ratio - fit width to content area, calculate height proportionally
    const pamphletMaxW = cw - 4;
    // jsPDF addImage with width=0 or height=0 won't auto-calc, so we embed at full content width
    // and let the image maintain its aspect ratio by setting height to 0 (auto)
    const pamphletH = 0; // auto height based on aspect ratio
    ensureSpace(120);
    doc.setDrawColor(...MID_GREY);
    doc.setLineWidth(0.3);
    try {
      // addImage with height=0 uses natural aspect ratio in jsPDF
      const imgProps = doc.getImageProperties(`data:image/${pamphletImage.type.toLowerCase()};base64,${pamphletImage.base64}`);
      const aspectRatio = imgProps.height / imgProps.width;
      const calcH = pamphletMaxW * aspectRatio;
      const finalH = Math.min(calcH, 250); // cap to prevent overflow
      doc.rect(margin, y, cw, finalH + 4, "S");
      doc.addImage(pamphletImage.base64, pamphletImage.type, margin + 2, y + 2, pamphletMaxW, finalH);
      y += finalH + 8;
    } catch (e) {
      console.error("Pamphlet error:", e);
      doc.rect(margin, y, cw, 70, "S");
      y += 75;
    }
  } else {
    doc.setFontSize(9);
    doc.text("Image not available", margin + 3, y + 5);
    y += 10;
  }

  y += 5;

  // ═══════════════════════════════════════════
  // NOMINEE DETAILS
  // ═══════════════════════════════════════════
  drawSectionHeader(labels.nomineeDetails);

  // Clean two-column nominee layout
  const nomLabelW = 45;
  const nomValueW = (cw - nomLabelW * 2 - 14) / 2 + nomLabelW; // half-page col width
  const halfW = (cw - 14) / 2; // column gap ~14mm ≈ 40px
  const nomRowH = 7;
  const nomRowGap = 3.5; // ~10px

  const drawNomineeRow = (label1: string, val1: string, label2: string, val2: string) => {
    ensureSpace(nomRowH + nomRowGap);

    // Left column
    doc.setFont(fontFamily, "bold");
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_BLACK);
    doc.text(label1, margin + 3, y + 5);
    doc.setFont(fontFamily, "normal");
    doc.text(safeText(val1, np), margin + nomLabelW, y + 5);

    // Right column
    doc.setFont(fontFamily, "bold");
    doc.text(label2, margin + halfW + 14 + 3, y + 5);
    doc.setFont(fontFamily, "normal");
    doc.text(safeText(val2, np), margin + halfW + 14 + nomLabelW, y + 5);

    // Bottom border across full width
    doc.setDrawColor(...MID_GREY);
    doc.setLineWidth(0.15);
    doc.line(margin, y + nomRowH, pw - margin, y + nomRowH);

    y += nomRowH + nomRowGap;
  };

  // Nominee 1
  doc.setFont(fontFamily, "bold");
  doc.setFontSize(9);
  doc.setTextColor(...GOLD);
  doc.text(labels.nominee1Title, margin + 2, y);
  y += 5;

  drawNomineeRow(labels.nomineeName, data.nominee1_name, labels.nomineeRelation, data.nominee1_relation);
  drawNomineeRow(labels.nomineeAge, data.nominee1_age, labels.nomineeGender, data.nominee1_gender);

  y += 3;

  // Nominee 2
  doc.setFont(fontFamily, "bold");
  doc.setFontSize(9);
  doc.setTextColor(...GOLD);
  doc.text(labels.nominee2Title, margin + 2, y);
  y += 5;

  drawNomineeRow(labels.nomineeName, data.nominee2_name, labels.nomineeRelation, data.nominee2_relation);
  drawNomineeRow(labels.nomineeAge, data.nominee2_age, labels.nomineeGender, data.nominee2_gender);

  // ═══════════════════════════════════════════
  // ADDITIONAL MESSAGE
  // ═══════════════════════════════════════════
  const msg = safeText(data.additional_message, "");
  if (msg.length > 0) {
    drawSectionHeader(labels.additionalMessage);
    doc.setFontSize(9);
    doc.setFont(fontFamily, "normal");
    doc.setTextColor(...TEXT_BLACK);
    const msgLines = doc.splitTextToSize(msg, cw - 6);
    ensureSpace(msgLines.length * 5 + 5);
    doc.text(msgLines, margin + 3, y);
    y += msgLines.length * 5 + 8;
  }

  // ═══════════════════════════════════════════
  // SIGNATURE & SEAL - center-aligned block
  // ═══════════════════════════════════════════
  const baseUrl = Deno.env.get("SUPABASE_URL")!;
  const signatureImg = await loadImageFromUrl(`${baseUrl}/storage/v1/object/public/pdf-assets/signature.jpeg`);
  const sealImg = await loadImageFromUrl(`${baseUrl}/storage/v1/object/public/pdf-assets/seal.jpeg`);

  if (!signatureImg) console.error("Signature or Seal image not found");
  if (!sealImg) console.error("Signature or Seal image not found");

  // Block dimensions (in mm): ~42mm ≈ 120px width
  const blockW = 42;
  const sigImgH = 22;  // signature height
  const sealImgH = 18; // seal height
  const gapSigSeal = 0.7; // ~2px
  const gapSealText = 3.5; // ~10px
  const textLineH = 5;

  const totalBlockH = sigImgH + gapSigSeal + sealImgH + gapSealText + textLineH * 2 + 5;
  ensureSpace(totalBlockH + 15);

  // Center-align block on page
  const blockX = (pw - blockW) / 2;
  let sigY = Math.max(y + 10, 282 - 15 - totalBlockH);

  // Signature image
  if (signatureImg) {
    try { doc.addImage(signatureImg.base64, signatureImg.type, blockX, sigY, blockW, sigImgH); }
    catch (e) { console.error("Signature image error:", e); }
  }
  sigY += sigImgH + gapSigSeal;

  // Seal image
  if (sealImg) {
    try { doc.addImage(sealImg.base64, sealImg.type, blockX, sigY, blockW, sealImgH); }
    catch (e) { console.error("Seal image error:", e); }
  }
  sigY += sealImgH + gapSealText;

  // Text centered below images - 14px bold
  const textCenterX = pw / 2;
  doc.setFont(fontFamily, "bold");
  doc.setFontSize(10); // ~14px
  doc.setTextColor(...DARK_BROWN);
  doc.text(labels.title, textCenterX, sigY, { align: "center" });
  sigY += textLineH;
  doc.text(labels.managingDirector, textCenterX, sigY, { align: "center" });

  // ═══════════════════════════════════════════
  // FOOTER on every page
  // ═══════════════════════════════════════════
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont(fontFamily, "normal");
    doc.setFontSize(7);
    doc.setTextColor(...TEXT_GREY);
    doc.text(labels.footer, pw / 2, 290, { align: "center" });
  }

  const pdfBytes = new Uint8Array(doc.output("arraybuffer"));
  console.log("PDF GENERATED SUCCESSFULLY, size:", pdfBytes.length, "bytes");
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
