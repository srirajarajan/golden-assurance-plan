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
  application_number?: string;
  dob?: string;
  area?: string;
  taluk?: string;
  district?: string;
  pincode?: string;
  allocated_officer?: string;
  allocated_officer_number?: string;
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
  user_id: string;
  serial_number: string;
  selected_plan?: string;
  plan_code?: string;
  plan_name?: string;
  plan_amount?: number;
  plan_worth?: number;
  plan_activation?: string;
  plan_benefits?: string[];
}

const tamilLabels = {
  title: "William Carey Funeral Services Pvt. Ltd.",
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
  nomineeDetails: "வாரிசு விவரங்கள்",
  nominee1Title: "வாரிசு 1",
  nominee2Title: "வாரிசு 2",
  nomineeName: "வாரிசு பெயர்",
  nomineeGender: "பாலினம்",
  nomineeAge: "வயது",
  nomineeRelation: "உறவு முறை",
  additionalMessage: "கூடுதல் செய்தி",
  notProvided: "வழங்கப்படவில்லை",
  footer: "",
  managingDirector: "நிர்வாக இயக்குநர்",
  paymentMethod: "செலுத்தும் முறை",
  cash: "பணம்",
  upi: "UPI",
  selectedPlan: "தேர்ந்தெடுக்கப்பட்ட திட்டம்",
  planBenefits: "திட்ட நன்மைகள்",
  activation: "சேவை செயல்பாடு",
  benefitsWorth: "நன்மைகள் மதிப்பு",
};

const englishLabels = {
  title: "William Carey Funeral Services Pvt. Ltd.",
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
  nomineeDetails: "NOMINEE DETAILS",
  nominee1Title: "Nominee 1",
  nominee2Title: "Nominee 2",
  nomineeName: "Nominee Name",
  nomineeGender: "Gender",
  nomineeAge: "Age",
  nomineeRelation: "Relationship",
  additionalMessage: "ADDITIONAL MESSAGE",
  notProvided: "Not Provided",
  footer: "",
  managingDirector: "Managing Director",
  paymentMethod: "Payment Method",
  cash: "Cash",
  upi: "UPI",
  selectedPlan: "SELECTED PLAN",
  planBenefits: "Plan Benefits",
  activation: "Service Activation",
  benefitsWorth: "Benefits Worth",
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
// Official William Carey Golden Theme (no brown)
const GOLD = [164, 127, 55] as const;        // #A47F37 primary gold
const GOLD_DARK = [122, 92, 32] as const;    // deep gold for headings/text
const GOLD_SOFT = [252, 246, 232] as const;  // light gold tint for backgrounds
const GOLD_BAND = [212, 175, 90] as const;   // section bar
const MID_GREY = [200, 200, 200] as const;
const LINE_GREY = [225, 220, 210] as const;
const TEXT_BLACK = [33, 33, 33] as const;
const TEXT_GREY = [120, 120, 120] as const;
const WHITE = [255, 255, 255] as const;
const CHECK_GREEN = [34, 139, 78] as const;

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
  const ph = 297;
  const marginX = 14;     // ~40px
  const marginTop = 12;   // ~35px
  const marginBottom = 12;
  const cw = pw - 2 * marginX;
  let y = marginTop;

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

  // ═════════════════════════ Vector icon helpers ═════════════════════════
  const iconPhone = (x: number, cy: number, s = 3) => {
    doc.setDrawColor(...GOLD); doc.setLineWidth(0.35);
    doc.roundedRect(x, cy - s / 2, s * 0.75, s, 0.4, 0.4, "S");
    doc.setDrawColor(...GOLD); doc.setLineWidth(0.25);
    doc.line(x + 0.3, cy - s / 2 + 0.5, x + s * 0.75 - 0.3, cy - s / 2 + 0.5);
    doc.line(x + 0.3, cy + s / 2 - 0.5, x + s * 0.75 - 0.3, cy + s / 2 - 0.5);
  };
  const iconGlobe = (x: number, cy: number, s = 3) => {
    const r = s / 2;
    doc.setDrawColor(...GOLD); doc.setLineWidth(0.3);
    doc.circle(x + r, cy, r, "S");
    doc.ellipse(x + r, cy, r * 0.4, r, "S");
    doc.line(x, cy, x + s, cy);
  };
  const iconMail = (x: number, cy: number, s = 3) => {
    const w = s * 1.3, h = s * 0.85;
    doc.setDrawColor(...GOLD); doc.setLineWidth(0.3);
    doc.rect(x, cy - h / 2, w, h, "S");
    doc.line(x, cy - h / 2, x + w / 2, cy + h / 2 - 0.4);
    doc.line(x + w, cy - h / 2, x + w / 2, cy + h / 2 - 0.4);
  };
  const iconCheck = (x: number, cy: number, s = 3) => {
    doc.setDrawColor(...CHECK_GREEN); doc.setLineWidth(0.6);
    doc.line(x, cy + 0.2, x + s * 0.35, cy + s * 0.55);
    doc.line(x + s * 0.35, cy + s * 0.55, x + s, cy - s * 0.45);
  };

  // ═════════════════════════ Premium 3-column Header ═════════════════════════
  const logoImg = await loadImageFromUrl(`${supabaseUrl}/storage/v1/object/public/pdf-assets/logo.png`);
  const drawHeader = () => {
    const top = marginTop;
    const logoSize = 22;
    const headerH = logoSize; // shared vertical band
    const cyBand = top + headerH / 2;

    // Left: logo vertically centered in band
    if (logoImg) {
      try { doc.addImage(logoImg.base64, logoImg.type, marginX, top, logoSize, logoSize); }
      catch (e) { console.error("Logo error:", e); }
    }

    // Center: name + address, vertically centered around cyBand
    doc.setFont(fontFamily, "bold");
    doc.setFontSize(13);
    doc.setTextColor(...GOLD_DARK);
    doc.text("William Carey Funeral Services Pvt. Ltd.", pw / 2, cyBand - 1, { align: "center" });
    doc.setFont(fontFamily, "normal");
    doc.setFontSize(7.8);
    doc.setTextColor(...TEXT_GREY);
    doc.text("RR Complex, Kannankurichi Main Road, Chinnathirupathi, Salem – 636008",
      pw / 2, cyBand + 4, { align: "center" });

    // Right: contact – 3 evenly spaced lines, aligned so block matches band
    const rx = pw - marginX;
    doc.setFont(fontFamily, "normal");
    doc.setFontSize(8);
    const lineGap = 5.2;
    const startY = cyBand - lineGap; // top line
    const lines = [
      { icon: iconPhone, text: "9600350889", color: TEXT_BLACK },
      { icon: iconMail,  text: "wcfheadofficeslm2016@gmail.com", color: TEXT_BLACK },
      { icon: iconGlobe, text: "www.williamcareyfuneralservices.com", color: GOLD_DARK },
    ];
    lines.forEach((ln, i) => {
      const ly = startY + i * lineGap;
      doc.setTextColor(...ln.color);
      const tw = doc.getTextWidth(ln.text);
      doc.text(ln.text, rx, ly);
      ln.icon(rx - tw - 4.5, ly - 1.2, 3);
    });

    // Golden divider
    const divY = top + headerH + 3;
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.7);
    doc.line(marginX, divY, pw - marginX, divY);
    doc.setDrawColor(...GOLD_BAND);
    doc.setLineWidth(0.25);
    doc.line(marginX, divY + 1.1, pw - marginX, divY + 1.1);

    return divY + 4;
  };

  // ═════════════════════════ Section title bar (Golden) ═════════════════════════
  const drawSectionBar = (title: string, top: number) => {
    doc.setFillColor(...GOLD_BAND);
    doc.rect(marginX, top, cw, 6.2, "F");
    // subtle inner gold line
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.25);
    doc.line(marginX, top + 6.2, marginX + cw, top + 6.2);
    doc.setFont(fontFamily, "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(title, marginX + 3.5, top + 4.4);
    doc.setTextColor(...TEXT_BLACK);
    return top + 6.2;
  };

  // ═════════════════════════ PAGE 1 ═════════════════════════
  y = drawHeader();

  // App No + Date — twin equal chips
  const displayAppNo = (data.application_number && data.application_number.trim()) || data.serial_number;
  const chipGap = 4;
  const chipW = (cw - chipGap) / 2;
  const chipH = 9;
  const chipCY = y + chipH / 2 + 1.2;
  doc.setFillColor(...GOLD_SOFT);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.35);
  doc.roundedRect(marginX, y, chipW, chipH, 1.6, 1.6, "FD");
  doc.roundedRect(marginX + chipW + chipGap, y, chipW, chipH, 1.6, 1.6, "FD");
  doc.setFont(fontFamily, "bold"); doc.setFontSize(9); doc.setTextColor(...GOLD_DARK);
  doc.text(`${labels.applicationNo}:`, marginX + 3.5, chipCY);
  doc.text(`${labels.date}:`, marginX + chipW + chipGap + 3.5, chipCY);
  doc.setFont(fontFamily, "normal"); doc.setTextColor(...TEXT_BLACK);
  const appLabelW = doc.getTextWidth(`${labels.applicationNo}:`) + 5;
  const dateLabelW = doc.getTextWidth(`${labels.date}:`) + 5;
  doc.text(displayAppNo, marginX + appLabelW, chipCY);
  doc.text(submissionDate, marginX + chipW + chipGap + dateLabelW, chipCY);
  y += chipH + 3;

  // Applicant Details grid — two column, last-odd row spans full width
  y = drawSectionBar(labels.applicantDetails, y);
  const paymentVal = (data.payment_method || "").trim().toLowerCase();
  const isCash = paymentVal === "cash" || paymentVal === "பணம்";
  const paymentDisplay = isCash ? labels.cash : labels.upi;

  const applicantFields: [string, string][] = [
    [labels.memberName, safeText(data.member_name, np)],
    [labels.guardianName, safeText(data.guardian_name, np)],
    [labels.gender, safeText(data.gender, np)],
    [labels.age, safeText(data.age, np)],
    [labels.occupation, safeText(data.occupation, np)],
    [labels.annualIncome, safeText(data.annual_income, np)],
    [labels.aadhaarNumber, safeText(data.aadhaar_number, np)],
    [labels.mobileNumber, safeText(data.mobile_number, np)],
    [labels.paymentMethod, paymentDisplay],
    ["Date of Birth", safeText(data.dob, np)],
    ["Taluk", safeText(data.taluk || data.area, np)],
    ["District", safeText(data.district, np)],
    ["Pincode", safeText(data.pincode, np)],
  ];
  const cellW = cw / 2;
  const cellH = 9;
  const totalRows = Math.ceil(applicantFields.length / 2);
  const gridH = totalRows * cellH;
  doc.setFillColor(...WHITE);
  doc.setDrawColor(...GOLD); doc.setLineWidth(0.35);
  doc.rect(marginX, y, cw, gridH, "FD");
  applicantFields.forEach((f, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const isLastOddSpan = (i === applicantFields.length - 1) && applicantFields.length % 2 === 1;
    const cx = marginX + (isLastOddSpan ? 0 : col * cellW);
    const cyR = y + row * cellH;
    const wC = isLastOddSpan ? cw : cellW;
    if (row % 2 === 1) {
      doc.setFillColor(...GOLD_SOFT); doc.rect(cx, cyR, wC, cellH, "F");
    }
    // dividers
    doc.setDrawColor(...LINE_GREY); doc.setLineWidth(0.15);
    if (!isLastOddSpan && col === 0) doc.line(cx + cellW, cyR, cx + cellW, cyR + cellH);
    if (row < totalRows - 1) doc.line(cx, cyR + cellH, cx + wC, cyR + cellH);
    // label
    doc.setFont(fontFamily, "bold"); doc.setFontSize(6.8); doc.setTextColor(...GOLD_DARK);
    doc.text(f[0].toUpperCase(), cx + 3.5, cyR + 3.2);
    // value (vertically balanced)
    doc.setFont(fontFamily, "normal"); doc.setFontSize(8.6); doc.setTextColor(...TEXT_BLACK);
    const v = doc.splitTextToSize(f[1], wC - 7);
    doc.text(v[0] || "", cx + 3.5, cyR + 7.4);
  });
  y += gridH + 3;

  // Permanent Address — dynamic compact height
  y = drawSectionBar(labels.address, y);
  const addr = safeText(data.address, np);
  const addrLines = doc.splitTextToSize(addr, cw - 6).slice(0, 3);
  const addrH = addrLines.length * 4.4 + 4.5;
  doc.setDrawColor(...GOLD); doc.setLineWidth(0.3);
  doc.setFillColor(...WHITE);
  doc.rect(marginX, y, cw, addrH, "FD");
  doc.setFont(fontFamily, "normal"); doc.setFontSize(9); doc.setTextColor(...TEXT_BLACK);
  const addrStartY = y + (addrH - addrLines.length * 4.4) / 2 + 3;
  doc.text(addrLines, marginX + 3.5, addrStartY);
  y += addrH + 3;

  // Allocated Officer — 2 columns with generous padding
  y = drawSectionBar("ALLOCATED OFFICER DETAILS", y);
  const offW = cw / 2, offH = 12;
  doc.setDrawColor(...GOLD); doc.setLineWidth(0.3); doc.setFillColor(...WHITE);
  doc.rect(marginX, y, cw, offH, "FD");
  doc.setDrawColor(...LINE_GREY); doc.setLineWidth(0.2);
  doc.line(marginX + offW, y + 2, marginX + offW, y + offH - 2);
  doc.setFont(fontFamily, "bold"); doc.setFontSize(6.8); doc.setTextColor(...GOLD_DARK);
  doc.text("ALLOCATED OFFICER", marginX + 3.5, y + 4.2);
  doc.text("OFFICER NUMBER", marginX + offW + 3.5, y + 4.2);
  doc.setFont(fontFamily, "normal"); doc.setFontSize(9); doc.setTextColor(...TEXT_BLACK);
  doc.text(safeText(data.allocated_officer, np), marginX + 3.5, y + 9.4);
  doc.text(safeText(data.allocated_officer_number, np), marginX + offW + 3.5, y + 9.4);
  y += offH + 3;

  // Nominee Details table — proportional 45/25/15/15, vertically centered
  y = drawSectionBar(labels.nomineeDetails, y);
  const nomCols = [
    { label: "NOMINEE NAME", w: cw * 0.45 },
    { label: "RELATIONSHIP", w: cw * 0.25 },
    { label: "GENDER", w: cw * 0.15 },
    { label: "AGE", w: cw * 0.15 },
  ];
  const nomHeaderH = 7, nomRowH = 8.5;
  // header row
  doc.setFillColor(...GOLD_SOFT);
  doc.setDrawColor(...GOLD); doc.setLineWidth(0.35);
  doc.rect(marginX, y, cw, nomHeaderH, "FD");
  doc.setFont(fontFamily, "bold"); doc.setFontSize(7.6); doc.setTextColor(...GOLD_DARK);
  let cxH = marginX;
  nomCols.forEach((c) => { doc.text(c.label, cxH + 3.5, y + 4.6); cxH += c.w; });
  y += nomHeaderH;
  const nomineeRows = [
    [safeText(data.nominee1_name, np), safeText(data.nominee1_relation, np), safeText(data.nominee1_gender, np), safeText(data.nominee1_age, np)],
    [safeText(data.nominee2_name, np), safeText(data.nominee2_relation, np), safeText(data.nominee2_gender, np), safeText(data.nominee2_age, np)],
  ];
  nomineeRows.forEach((row, ri) => {
    if (ri % 2 === 1) { doc.setFillColor(253, 250, 244); doc.rect(marginX, y, cw, nomRowH, "F"); }
    doc.setDrawColor(...LINE_GREY); doc.setLineWidth(0.15);
    doc.line(marginX, y + nomRowH, marginX + cw, y + nomRowH);
    doc.setFont(fontFamily, "normal"); doc.setFontSize(8.6); doc.setTextColor(...TEXT_BLACK);
    let rx = marginX;
    row.forEach((cell, ci) => {
      doc.text(String(cell), rx + 3.5, y + nomRowH / 2 + 1.6);
      rx += nomCols[ci].w;
    });
    y += nomRowH;
  });
  // outer border
  doc.setDrawColor(...GOLD); doc.setLineWidth(0.35);
  doc.rect(marginX, y - nomRowH * nomineeRows.length - nomHeaderH, cw, nomHeaderH + nomRowH * nomineeRows.length, "S");
  y += 3;

  // Additional Message — dynamic height, compact when short
  const msg = safeText(data.additional_message, "");
  if (msg.length > 0) {
    y = drawSectionBar(labels.additionalMessage, y);
    doc.setFont(fontFamily, "normal"); doc.setFontSize(9);
    const mLines = doc.splitTextToSize(msg, cw - 7).slice(0, 4);
    const mH = mLines.length * 4.4 + 5;
    doc.setDrawColor(...GOLD); doc.setLineWidth(0.3);
    doc.setFillColor(...GOLD_SOFT);
    doc.rect(marginX, y, cw, mH, "FD");
    doc.setTextColor(...TEXT_BLACK);
    doc.text(mLines, marginX + 3.5, y + 5);
    y += mH;
  }

  // ═════════════════════════ PAGE 2 ═════════════════════════
  doc.addPage();
  y = drawHeader();

  // Aadhaar images
  y = drawSectionBar(labels.aadhaarImages, y);
  const aadhaarFront = await fetchImageAsBase64(supabase, data.aadhaar_front_path);
  const aadhaarBack = await fetchImageAsBase64(supabase, data.aadhaar_back_path);
  const gapImg = 6;
  const boxW = (cw - gapImg) / 2;
  const boxH = 58;
  const labelH = 6;
  doc.setFillColor(...GOLD_SOFT);
  doc.rect(marginX, y, boxW, labelH, "F");
  doc.rect(marginX + boxW + gapImg, y, boxW, labelH, "F");
  doc.setFont(fontFamily, "bold"); doc.setFontSize(8); doc.setTextColor(...GOLD_DARK);
  doc.text(labels.aadhaarFront, marginX + boxW / 2, y + 4.2, { align: "center" });
  doc.text(labels.aadhaarBack, marginX + boxW + gapImg + boxW / 2, y + 4.2, { align: "center" });
  y += labelH;
  doc.setDrawColor(...GOLD); doc.setLineWidth(0.4);
  doc.rect(marginX, y, boxW, boxH, "S");
  doc.rect(marginX + boxW + gapImg, y, boxW, boxH, "S");
  if (aadhaarFront) {
    try { doc.addImage(aadhaarFront.base64, aadhaarFront.type, marginX + 2, y + 2, boxW - 4, boxH - 4); }
    catch (e) { console.error("Aadhaar front error:", e); }
  }
  if (aadhaarBack) {
    try { doc.addImage(aadhaarBack.base64, aadhaarBack.type, marginX + boxW + gapImg + 2, y + 2, boxW - 4, boxH - 4); }
    catch (e) { console.error("Aadhaar back error:", e); }
  }
  y += boxH + 5;

  // Plan Card — balanced two-column
  const planCode = (data.plan_code || data.selected_plan || "").toString().toUpperCase();
  const planName = data.plan_name || "";
  const planAmount = data.plan_amount;
  const planWorth = data.plan_worth;
  const planActivation = data.plan_activation || "";
  const benefits = Array.isArray(data.plan_benefits) ? data.plan_benefits : [];

  y = drawSectionBar(labels.selectedPlan, y);
  const cardY = y;
  const padX = 6;
  const colGap = 6;
  const colW = (cw - colGap) / 2;

  // Compute needed height from both columns
  const benefitLineH = 5.0;
  const leftLines = 3 + (planActivation ? 0 : 0); // title, amount, start date
  const leftH = 10 /*title*/ + 12 /*amount*/ + 8 /*start date*/;
  const rightH = 10 /*worth*/ + 8 /*coverage*/ + 6 /*label*/ + Math.max(1, benefits.length) * benefitLineH;
  const cardH = Math.max(leftH, rightH) + 12;

  doc.setFillColor(...GOLD_SOFT);
  doc.setDrawColor(...GOLD); doc.setLineWidth(0.55);
  doc.roundedRect(marginX, cardY, cw, cardH, 2.2, 2.2, "FD");
  // Column separator
  doc.setDrawColor(...GOLD); doc.setLineWidth(0.2);
  doc.line(marginX + colW + colGap / 2, cardY + 4, marginX + colW + colGap / 2, cardY + cardH - 4);

  // LEFT column
  const lx = marginX + padX;
  let ly = cardY + 8;
  doc.setFont(fontFamily, "bold"); doc.setFontSize(7.2); doc.setTextColor(...GOLD_DARK);
  doc.text("SELECTED PLAN", lx, ly);
  ly += 5;
  doc.setFont(fontFamily, "bold"); doc.setFontSize(13); doc.setTextColor(...TEXT_BLACK);
  doc.text(`${planCode}${planName ? "  —  " + planName : ""}`, lx, ly);
  ly += 8;
  doc.setFont(fontFamily, "bold"); doc.setFontSize(7.2); doc.setTextColor(...GOLD_DARK);
  doc.text("PLAN AMOUNT", lx, ly);
  ly += 5;
  doc.setFont(fontFamily, "bold"); doc.setFontSize(15); doc.setTextColor(...GOLD_DARK);
  doc.text(typeof planAmount === "number" ? `Rs. ${planAmount.toLocaleString("en-IN")}` : "—", lx, ly);
  ly += 7;
  doc.setFont(fontFamily, "bold"); doc.setFontSize(7.2); doc.setTextColor(...GOLD_DARK);
  doc.text("SERVICE START DATE", lx, ly);
  ly += 4.5;
  doc.setFont(fontFamily, "normal"); doc.setFontSize(9); doc.setTextColor(...TEXT_BLACK);
  doc.text(planActivation || submissionDate, lx, ly);

  // RIGHT column
  const rxc = marginX + colW + colGap + padX / 2;
  let ry = cardY + 8;
  doc.setFont(fontFamily, "bold"); doc.setFontSize(7.2); doc.setTextColor(...GOLD_DARK);
  doc.text("BENEFITS WORTH", rxc, ry);
  ry += 5;
  doc.setFont(fontFamily, "bold"); doc.setFontSize(13); doc.setTextColor(...GOLD_DARK);
  doc.text(typeof planWorth === "number" ? `Rs. ${planWorth.toLocaleString("en-IN")}` : "—", rxc, ry);
  ry += 7;
  doc.setFont(fontFamily, "bold"); doc.setFontSize(7.2); doc.setTextColor(...GOLD_DARK);
  doc.text("COVERAGE", rxc, ry);
  ry += 4.5;
  doc.setFont(fontFamily, "normal"); doc.setFontSize(9); doc.setTextColor(...TEXT_BLACK);
  doc.text("Complete funeral service — A to Z arrangements", rxc, ry);
  ry += 6;
  doc.setFont(fontFamily, "bold"); doc.setFontSize(7.2); doc.setTextColor(...GOLD_DARK);
  doc.text("PLAN SUMMARY", rxc, ry);
  ry += 4.5;
  doc.setFont(fontFamily, "normal"); doc.setFontSize(8.6); doc.setTextColor(...TEXT_BLACK);
  benefits.slice(0, 5).forEach((b) => {
    iconCheck(rxc, ry - 1.8, 2.6);
    const bl = doc.splitTextToSize(String(b), colW - padX - 6);
    doc.text(bl[0] || "", rxc + 4.5, ry);
    ry += benefitLineH;
  });

  y = cardY + cardH + 4;

  // ─── Seal & Signature block: bottom-right aligned ───
  const sealSignImg = await loadImageFromUrl(`${supabaseUrl}/storage/v1/object/public/pdf-assets/seal-signature.png`);
  const sealSignW = 55;
  let sealSignH = 40;
  if (sealSignImg) {
    try {
      const props = doc.getImageProperties(`data:image/${sealSignImg.type.toLowerCase()};base64,${sealSignImg.base64}`);
      sealSignH = sealSignW * (props.height / props.width);
    } catch (_) {}
  }
  const blockRightX = pw - marginX;
  const blockBottomY = ph - marginBottom;
  const totalBlockH = 6 /*company*/ + 4 /*gap*/ + sealSignH + 4 /*gap*/ + 5 /*MD*/;
  const blockTopY = blockBottomY - totalBlockH;
  const centerXOfBlock = blockRightX - sealSignW / 2;

  doc.setFont(fontFamily, "bold"); doc.setFontSize(9); doc.setTextColor(...GOLD_DARK);
  doc.text("William Carey Funeral Services Pvt. Ltd.", blockRightX, blockTopY + 4, { align: "right" });
  if (sealSignImg) {
    try {
      doc.addImage(
        sealSignImg.base64, sealSignImg.type,
        blockRightX - sealSignW, blockTopY + 8,
        sealSignW, sealSignH
      );
    } catch (e) { console.error("Seal error:", e); }
  }
  doc.setFont(fontFamily, "bold"); doc.setFontSize(9); doc.setTextColor(...TEXT_BLACK);
  doc.text(labels.managingDirector, blockRightX, blockTopY + 8 + sealSignH + 5, { align: "right" });

  const pdfBytes = new Uint8Array(doc.output("arraybuffer"));
  console.log("PDF GENERATED SUCCESSFULLY, size:", pdfBytes.length, "bytes, pages:", doc.getNumberOfPages());
  return pdfBytes;
}

// ─── Email ───
async function sendEmailWithPdf(pdfBuffer: Uint8Array, fullName: string, serialNumber: string): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_API_KEY) return { ok: false, error: "Email service not configured. Contact developer." };

  const filename = `${serialNumber}.pdf`;
  const submissionDate = new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
  const pdfBase64 = uint8ArrayToBase64(pdfBuffer);

  const emailPayload = {
    from: "William Carey Funeral Services <onboarding@resend.dev>",
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
      <p style="color:#888;font-size:12px">William Carey Funeral Services Pvt. Ltd.</p>
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
    const fileLabel = (data.application_number && data.application_number.trim()) || data.serial_number;
    const emailResult = await sendEmailWithPdf(pdfBuffer, data.member_name, fileLabel);

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
