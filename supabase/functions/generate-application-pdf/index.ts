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
    doc.setDrawColor(34, 139, 78); doc.setLineWidth(0.6);
    doc.line(x, cy + 0.2, x + s * 0.35, cy + s * 0.55);
    doc.line(x + s * 0.35, cy + s * 0.55, x + s, cy - s * 0.45);
  };

  // ═════════════════════════ Header (invoice-style) ═════════════════════════
  const logoImg = await loadImageFromUrl(`${supabaseUrl}/storage/v1/object/public/pdf-assets/logo.png`);
  const drawHeader = () => {
    const top = margin;
    const logoSize = 20;
    if (logoImg) {
      try { doc.addImage(logoImg.base64, logoImg.type, margin, top, logoSize, logoSize); }
      catch (e) { console.error("Logo error:", e); }
    }
    // Center: name + address
    doc.setFont(fontFamily, "bold");
    doc.setFontSize(13);
    doc.setTextColor(...DARK_BROWN);
    doc.text("William Carey Funeral Services Pvt. Ltd.", pw / 2, top + 7, { align: "center" });
    doc.setFont(fontFamily, "normal");
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_GREY);
    doc.text("RR Complex, Kannankurichi Main Road, Chinnathirupathi, Salem - 636008",
      pw / 2, top + 12, { align: "center" });

    // Right: contact with icons (icons at fixed x, text right-aligned)
    const rx = pw - margin;
    doc.setFont(fontFamily, "normal");
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_BLACK);

    const phoneTxt = "9600350889";
    const webTxt = "www.williamcareyfuneralservices.com";
    const mailTxt = "williamcareyfuneral99@gmail.com";

    const line1Y = top + 4.5;
    const line2Y = top + 10;
    const line3Y = top + 15.5;

    // Draw text right-aligned, then icon just to the left of text
    const gap = 1.8;
    const drawContact = (icon: (x: number, cy: number) => void, text: string, ly: number) => {
      const tw = doc.getTextWidth(text);
      doc.text(text, rx, ly);
      icon(rx - tw - gap - 3.2, ly - 1.2);
    };
    drawContact((x, cy) => iconPhone(x, cy), phoneTxt, line1Y);
    doc.setTextColor(...GOLD);
    drawContact((x, cy) => iconGlobe(x, cy), webTxt, line2Y);
    doc.setTextColor(...TEXT_BLACK);
    drawContact((x, cy) => iconMail(x, cy), mailTxt, line3Y);

    // Divider
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.7);
    doc.line(margin, top + logoSize + 2, pw - margin, top + logoSize + 2);
    doc.setDrawColor(...MID_GREY);
    doc.setLineWidth(0.2);
    doc.line(margin, top + logoSize + 3, pw - margin, top + logoSize + 3);

    return top + logoSize + 6; // return Y after header
  };

  // ═════════════════════════ Section title bar ═════════════════════════
  const drawSectionBar = (title: string, top: number) => {
    doc.setFillColor(...DARK_BROWN);
    doc.rect(margin, top, cw, 6.5, "F");
    doc.setFont(fontFamily, "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(title, margin + 3, top + 4.6);
    doc.setTextColor(...TEXT_BLACK);
    return top + 6.5;
  };

  // ═════════════════════════ PAGE 1 ═════════════════════════
  y = drawHeader();

  // App No + Date row (chips)
  const displayAppNo = (data.application_number && data.application_number.trim()) || data.serial_number;
  doc.setFillColor(245, 240, 230);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, (cw - 4) / 2, 8, 1.5, 1.5, "FD");
  doc.roundedRect(margin + (cw - 4) / 2 + 4, y, (cw - 4) / 2, 8, 1.5, 1.5, "FD");
  doc.setFont(fontFamily, "bold"); doc.setFontSize(9); doc.setTextColor(...DARK_BROWN);
  doc.text(`${labels.applicationNo}:`, margin + 3, y + 5.3);
  doc.text(`${labels.date}:`, margin + (cw - 4) / 2 + 7, y + 5.3);
  doc.setFont(fontFamily, "normal"); doc.setTextColor(...TEXT_BLACK);
  doc.text(displayAppNo, margin + 33, y + 5.3);
  doc.text(submissionDate, margin + (cw - 4) / 2 + 7 + 16, y + 5.3);
  y += 11;

  // Applicant Details card — two column grid (label above value pairs)
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
  // 2-column grid
  const cellW = cw / 2;
  const cellH = 8;
  const rows = Math.ceil(applicantFields.length / 2);
  const gridH = rows * cellH;
  // Card background
  doc.setFillColor(...WHITE);
  doc.setDrawColor(...MID_GREY); doc.setLineWidth(0.25);
  doc.rect(margin, y, cw, gridH, "FD");
  applicantFields.forEach((f, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const cx = margin + col * cellW;
    const cy = y + row * cellH;
    // subtle row bg
    if (row % 2 === 1) { doc.setFillColor(250, 248, 244); doc.rect(cx, cy, cellW, cellH, "F"); }
    // divider lines
    doc.setDrawColor(230, 226, 220); doc.setLineWidth(0.1);
    if (col === 0) doc.line(cx + cellW, cy, cx + cellW, cy + cellH);
    doc.line(cx, cy + cellH, cx + cellW, cy + cellH);
    // label
    doc.setFont(fontFamily, "bold"); doc.setFontSize(7.2); doc.setTextColor(...TEXT_GREY);
    doc.text(f[0].toUpperCase(), cx + 3, cy + 3);
    // value
    doc.setFont(fontFamily, "normal"); doc.setFontSize(8.5); doc.setTextColor(...TEXT_BLACK);
    const v = doc.splitTextToSize(f[1], cellW - 6);
    doc.text(v[0] || "", cx + 3, cy + 6.8);
  });
  y += gridH + 3;

  // Permanent Address — bordered section
  y = drawSectionBar(labels.address, y);
  const addr = safeText(data.address, np);
  const addrLines = doc.splitTextToSize(addr, cw - 6).slice(0, 3);
  const addrH = Math.max(11, addrLines.length * 4.6 + 4);
  doc.setDrawColor(...MID_GREY); doc.setLineWidth(0.25);
  doc.setFillColor(...WHITE);
  doc.rect(margin, y, cw, addrH, "FD");
  doc.setFont(fontFamily, "normal"); doc.setFontSize(9); doc.setTextColor(...TEXT_BLACK);
  doc.text(addrLines, margin + 3, y + 5);
  y += addrH + 3;

  // Allocated Officer — 2 columns
  y = drawSectionBar("ALLOCATED OFFICER DETAILS", y);
  const offW = cw / 2, offH = 9;
  doc.setDrawColor(...MID_GREY); doc.setLineWidth(0.25); doc.setFillColor(...WHITE);
  doc.rect(margin, y, cw, offH, "FD");
  doc.line(margin + offW, y, margin + offW, y + offH);
  doc.setFont(fontFamily, "bold"); doc.setFontSize(7.2); doc.setTextColor(...TEXT_GREY);
  doc.text("ALLOCATED OFFICER", margin + 3, y + 3.3);
  doc.text("OFFICER NUMBER", margin + offW + 3, y + 3.3);
  doc.setFont(fontFamily, "normal"); doc.setFontSize(9); doc.setTextColor(...TEXT_BLACK);
  doc.text(safeText(data.allocated_officer, np), margin + 3, y + 7.4);
  doc.text(safeText(data.allocated_officer_number, np), margin + offW + 3, y + 7.4);
  y += offH + 3;

  // Nominee Details table
  y = drawSectionBar(labels.nomineeDetails, y);
  const nomCols = [
    { label: "NOMINEE", w: cw * 0.35 },
    { label: "RELATIONSHIP", w: cw * 0.25 },
    { label: "GENDER", w: cw * 0.20 },
    { label: "AGE", w: cw * 0.20 },
  ];
  const headerH = 6.5, rowHeight = 7.5;
  // header row
  doc.setFillColor(...LIGHT_GREY_BG);
  doc.setDrawColor(...MID_GREY); doc.setLineWidth(0.25);
  doc.rect(margin, y, cw, headerH, "FD");
  doc.setFont(fontFamily, "bold"); doc.setFontSize(7.6); doc.setTextColor(...DARK_BROWN);
  let cx = margin;
  nomCols.forEach((c) => { doc.text(c.label, cx + 3, y + 4.4); cx += c.w; });
  y += headerH;
  const nomineeRows = [
    [safeText(data.nominee1_name, np), safeText(data.nominee1_relation, np), safeText(data.nominee1_gender, np), safeText(data.nominee1_age, np)],
    [safeText(data.nominee2_name, np), safeText(data.nominee2_relation, np), safeText(data.nominee2_gender, np), safeText(data.nominee2_age, np)],
  ];
  nomineeRows.forEach((row, ri) => {
    if (ri % 2 === 1) { doc.setFillColor(250, 248, 244); doc.rect(margin, y, cw, rowHeight, "F"); }
    doc.setDrawColor(230, 226, 220); doc.setLineWidth(0.15);
    doc.line(margin, y + rowHeight, margin + cw, y + rowHeight);
    doc.setFont(fontFamily, "normal"); doc.setFontSize(8.5); doc.setTextColor(...TEXT_BLACK);
    let rx = margin;
    row.forEach((cell, ci) => {
      doc.text(String(cell), rx + 3, y + 5);
      rx += nomCols[ci].w;
    });
    y += rowHeight;
  });
  // outer border
  doc.setDrawColor(...MID_GREY); doc.setLineWidth(0.25);
  doc.rect(margin, y - rowHeight * nomineeRows.length - headerH, cw, headerH + rowHeight * nomineeRows.length, "S");
  y += 3;

  // Additional Message
  const msg = safeText(data.additional_message, "");
  if (msg.length > 0) {
    y = drawSectionBar(labels.additionalMessage, y);
    const mLines = doc.splitTextToSize(msg, cw - 6).slice(0, 3);
    const mH = Math.max(11, mLines.length * 4.6 + 4);
    doc.setDrawColor(...GOLD); doc.setLineWidth(0.3);
    doc.setFillColor(253, 250, 244);
    doc.rect(margin, y, cw, mH, "FD");
    doc.setFont(fontFamily, "normal"); doc.setFontSize(9); doc.setTextColor(...TEXT_BLACK);
    doc.text(mLines, margin + 3, y + 5);
    y += mH;
  }

  // ═════════════════════════ PAGE 2 ═════════════════════════
  doc.addPage();
  y = drawHeader();

  // Aadhaar images
  y = drawSectionBar(labels.aadhaarImages, y);
  const aadhaarFront = await fetchImageAsBase64(supabase, data.aadhaar_front_path);
  const aadhaarBack = await fetchImageAsBase64(supabase, data.aadhaar_back_path);
  const gap = 6;
  const boxW = (cw - gap) / 2;
  const boxH = 55;
  const labelH = 6;
  doc.setFillColor(...LIGHT_GREY_BG);
  doc.rect(margin, y, boxW, labelH, "F");
  doc.rect(margin + boxW + gap, y, boxW, labelH, "F");
  doc.setFont(fontFamily, "bold"); doc.setFontSize(8); doc.setTextColor(...DARK_BROWN);
  doc.text(labels.aadhaarFront, margin + boxW / 2, y + 4.2, { align: "center" });
  doc.text(labels.aadhaarBack, margin + boxW + gap + boxW / 2, y + 4.2, { align: "center" });
  y += labelH;
  doc.setDrawColor(...MID_GREY); doc.setLineWidth(0.4);
  doc.rect(margin, y, boxW, boxH, "S");
  doc.rect(margin + boxW + gap, y, boxW, boxH, "S");
  if (aadhaarFront) {
    try { doc.addImage(aadhaarFront.base64, aadhaarFront.type, margin + 1.5, y + 1.5, boxW - 3, boxH - 3); }
    catch (e) { console.error("Aadhaar front error:", e); }
  }
  if (aadhaarBack) {
    try { doc.addImage(aadhaarBack.base64, aadhaarBack.type, margin + boxW + gap + 1.5, y + 1.5, boxW - 3, boxH - 3); }
    catch (e) { console.error("Aadhaar back error:", e); }
  }
  y += boxH + 5;

  // Plan Card
  const planCode = (data.plan_code || data.selected_plan || "").toString().toUpperCase();
  const planName = data.plan_name || "";
  const planAmount = data.plan_amount;
  const planWorth = data.plan_worth;
  const planActivation = data.plan_activation || "";
  const benefits = Array.isArray(data.plan_benefits) ? data.plan_benefits : [];

  y = drawSectionBar(labels.selectedPlan, y);
  const cardY = y;
  const padX = 6;
  // Card outline
  const benefitLineH = 5.2;
  const contentH = 26 + (planActivation ? 6 : 0) + 6 + benefits.length * benefitLineH + 4;
  doc.setFillColor(253, 250, 244);
  doc.setDrawColor(...GOLD); doc.setLineWidth(0.5);
  doc.roundedRect(margin, cardY, cw, contentH, 2, 2, "FD");

  let cy = cardY + 8;
  // Plan title + name
  doc.setFont(fontFamily, "bold"); doc.setFontSize(14); doc.setTextColor(...DARK_BROWN);
  doc.text(`${planCode} PLAN${planName ? "  —  " + planName : ""}`, margin + padX, cy);
  cy += 8;
  // Amount + worth
  if (typeof planAmount === "number") {
    doc.setFont(fontFamily, "bold"); doc.setFontSize(16); doc.setTextColor(...GOLD);
    doc.text(`Rs. ${planAmount.toLocaleString("en-IN")}`, margin + padX, cy);
    if (typeof planWorth === "number") {
      doc.setFont(fontFamily, "normal"); doc.setFontSize(9); doc.setTextColor(...TEXT_GREY);
      doc.text(`${labels.benefitsWorth}: Rs. ${planWorth.toLocaleString("en-IN")}`,
        pw - margin - padX, cy - 1, { align: "right" });
    }
    cy += 6;
  }
  if (planActivation) {
    doc.setFont(fontFamily, "bold"); doc.setFontSize(9); doc.setTextColor(...TEXT_BLACK);
    doc.text(`${labels.activation}: `, margin + padX, cy);
    const w = doc.getTextWidth(`${labels.activation}: `);
    doc.setFont(fontFamily, "normal");
    doc.text(planActivation, margin + padX + w, cy);
    cy += 6;
  }
  // Benefits header
  doc.setFont(fontFamily, "bold"); doc.setFontSize(10); doc.setTextColor(...DARK_BROWN);
  doc.text(labels.planBenefits, margin + padX, cy);
  cy += 5;
  // Benefits list with check icons — 2 columns if many
  doc.setFont(fontFamily, "normal"); doc.setFontSize(9); doc.setTextColor(...TEXT_BLACK);
  benefits.forEach((b) => {
    iconCheck(margin + padX, cy - 1.8, 3);
    doc.text(String(b), margin + padX + 5, cy);
    cy += benefitLineH;
  });
  y = cardY + contentH + 6;

  // Seal & Signature — centered at bottom
  const sealSignImg = await loadImageFromUrl(`${supabaseUrl}/storage/v1/object/public/pdf-assets/seal-signature.png`);
  const sealSignW = 55;
  let sealSignH = 45;
  if (sealSignImg) {
    try {
      const props = doc.getImageProperties(`data:image/${sealSignImg.type.toLowerCase()};base64,${sealSignImg.base64}`);
      sealSignH = sealSignW * (props.height / props.width);
    } catch (_) {}
  }
  const bottomY = 297 - 20; // above bottom margin
  const blockH = sealSignH + 12;
  const blockTop = bottomY - blockH;
  const sigCx = pw / 2;
  // Company name above image
  doc.setFont(fontFamily, "bold"); doc.setFontSize(10); doc.setTextColor(...DARK_BROWN);
  doc.text("William Carey Funeral Services Pvt. Ltd.", sigCx, blockTop, { align: "center" });
  // Seal-signature image
  if (sealSignImg) {
    try { doc.addImage(sealSignImg.base64, sealSignImg.type, sigCx - sealSignW / 2, blockTop + 2, sealSignW, sealSignH); }
    catch (e) { console.error("Seal error:", e); }
  }
  // Managing Director below
  doc.setFont(fontFamily, "bold"); doc.setFontSize(9); doc.setTextColor(...TEXT_BLACK);
  doc.text(labels.managingDirector, sigCx, blockTop + 2 + sealSignH + 5, { align: "center" });

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
