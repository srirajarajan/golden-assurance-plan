import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { PDFDocument, rgb } from "https://esm.sh/pdf-lib@1.17.1";
import fontkit from "https://esm.sh/@pdf-lib/fontkit@1.1.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

// Tamil translations
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

function safeText(v: unknown, fallback: string) {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : fallback;
}

async function fetchImageAsBytes(supabase: any, path: string): Promise<Uint8Array> {
  if (!path || path === "Not Provided") {
    throw new Error("Missing required image path");
  }

  const { data, error } = await supabase.storage
    .from("applications-images")
    .download(path);

  if (error) {
    throw new Error(`Failed to download image (${path}): ${error.message}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

async function embedImage(pdfDoc: PDFDocument, imageBytes: Uint8Array): Promise<any> {
  // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
  const isPng =
    imageBytes.length > 8 &&
    imageBytes[0] === 0x89 &&
    imageBytes[1] === 0x50 &&
    imageBytes[2] === 0x4e &&
    imageBytes[3] === 0x47 &&
    imageBytes[4] === 0x0d &&
    imageBytes[5] === 0x0a &&
    imageBytes[6] === 0x1a &&
    imageBytes[7] === 0x0a;

  return isPng ? await pdfDoc.embedPng(imageBytes) : await pdfDoc.embedJpg(imageBytes);
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const data: ApplicationData = await req.json();

    // Do not log PII
    console.log("generate-application-pdf: request received", {
      user_id: data.user_id,
      selected_language: data.selected_language,
    });

    const labels = data.selected_language === "Tamil" ? tamilLabels : englishLabels;
    const notProvided = labels.notProvided;

    // Fetch required images
    const [applicantPhotoBytes, aadhaarFrontBytes, aadhaarBackBytes, pamphletBytes] =
      await Promise.all([
        fetchImageAsBytes(supabase, data.applicant_photo_path),
        fetchImageAsBytes(supabase, data.aadhaar_front_path),
        fetchImageAsBytes(supabase, data.aadhaar_back_path),
        fetchImageAsBytes(supabase, data.pamphlet_image_path),
      ]);

    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    // Unicode-safe font for Tamil + English
    const fontBytes = await Deno.readFile(new URL("./NotoSansTamil-Regular.ttf", import.meta.url));
    const unicodeFont = await pdfDoc.embedFont(fontBytes, { subset: true });

    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 50;
    const lineHeight = 18;

    // Page 1
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    const drawText = (text: string, x: number, yPos: number, options: any = {}) => {
      const { font = unicodeFont, size = 11, color = rgb(0, 0, 0) } = options;
      page.drawText(text, { x, y: yPos, size, font, color });
    };

    const drawLine = (yPos: number) => {
      page.drawLine({
        start: { x: margin, y: yPos },
        end: { x: pageWidth - margin, y: yPos },
        thickness: 1,
        color: rgb(0.7, 0.7, 0.7),
      });
    };

    // Header
    drawText(labels.title, margin, y, { size: 18, color: rgb(0.4, 0.2, 0.1) });
    y -= 25;
    drawText(labels.subtitle, margin, y, { size: 14, color: rgb(0.5, 0.3, 0.15) });
    y -= 30;
    drawLine(y);
    y -= 25;

    // Applicant Photo (fixed)
    const applicantPhotoImage = await embedImage(pdfDoc, applicantPhotoBytes);
    page.drawImage(applicantPhotoImage, {
      x: pageWidth - margin - 100,
      y: y - 120 + 20,
      width: 100,
      height: 120,
    });

    // Applicant details
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

    // Nominee 1
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

    // Nominee 2
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
    if (additionalMessage) {
      drawText(`${labels.additionalMessage}:`, margin, y, { size: 10 });
      y -= lineHeight;
      drawText(additionalMessage, margin, y, { size: 10 });
      y -= lineHeight * 2;
    }

    // Page 2 (Images)
    const imagePage = pdfDoc.addPage([pageWidth, pageHeight]);
    let imgY = pageHeight - margin;

    const drawImageTitle = (title: string, yPos: number) => {
      imagePage.drawText(title, {
        x: margin,
        y: yPos,
        size: 12,
        font: unicodeFont,
        color: rgb(0.2, 0.4, 0.6),
      });
    };

    // Aadhaar Front
    drawImageTitle(labels.aadhaarFront, imgY);
    imgY -= 20;
    const aadhaarFrontImage = await embedImage(pdfDoc, aadhaarFrontBytes);
    imagePage.drawImage(aadhaarFrontImage, {
      x: margin,
      y: imgY - 160,
      width: 250,
      height: 160,
    });
    imgY -= 160 + 30;

    // Aadhaar Back
    drawImageTitle(labels.aadhaarBack, imgY);
    imgY -= 20;
    const aadhaarBackImage = await embedImage(pdfDoc, aadhaarBackBytes);
    imagePage.drawImage(aadhaarBackImage, {
      x: margin,
      y: imgY - 160,
      width: 250,
      height: 160,
    });
    imgY -= 160 + 30;

    // Pamphlet
    drawImageTitle(labels.pamphletImage, imgY);
    imgY -= 20;
    const pamphletImage = await embedImage(pdfDoc, pamphletBytes);
    imagePage.drawImage(pamphletImage, {
      x: margin,
      y: imgY - 180,
      width: 250,
      height: 180,
    });

    const pdfBytes = await pdfDoc.save();
    console.log("generate-application-pdf: pdf built", { bytes: pdfBytes.length });

    // Upload to private bucket
    const timestamp = Date.now();
    const fileName = `${data.user_id}/application_${timestamp}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("applications-pdf")
      .upload(fileName, pdfBytes, {
        contentType: "application/pdf",
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Failed to upload PDF: ${uploadError.message}`);
    }

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("applications-pdf")
      .createSignedUrl(fileName, 604800);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      throw new Error(`Failed to create signed URL: ${signedUrlError?.message || "unknown error"}`);
    }

    return new Response(
      JSON.stringify({ success: true, pdf_url: signedUrlData.signedUrl, file_name: fileName }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("generate-application-pdf: error", {
      message: error?.message || String(error),
    });

    return new Response(JSON.stringify({ error: error?.message || "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
