import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

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

async function fetchImageAsBytes(supabase: any, path: string): Promise<Uint8Array | null> {
  if (!path || path === "Not Provided") {
    console.log(`No image path provided for: ${path}`);
    return null;
  }

  try {
    console.log(`Fetching image from path: ${path}`);
    const { data, error } = await supabase.storage
      .from("applications-images")
      .download(path);

    if (error) {
      console.error(`Error downloading image ${path}:`, error);
      return null;
    }

    const arrayBuffer = await data.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (err) {
    console.error(`Failed to fetch image ${path}:`, err);
    return null;
  }
}

async function embedImage(
  pdfDoc: PDFDocument,
  imageBytes: Uint8Array | null,
  mimeType: string
): Promise<any | null> {
  if (!imageBytes) return null;

  try {
    if (mimeType.includes("png")) {
      return await pdfDoc.embedPng(imageBytes);
    } else {
      return await pdfDoc.embedJpg(imageBytes);
    }
  } catch (err) {
    console.error("Failed to embed image:", err);
    return null;
  }
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
    console.log("Received application data for PDF generation:", {
      member_name: data.member_name,
      user_id: data.user_id,
      selected_language: data.selected_language,
    });

    const labels = data.selected_language === "Tamil" ? tamilLabels : englishLabels;
    const notProvided = labels.notProvided;

    // Fetch all images in parallel
    const [applicantPhotoBytes, aadhaarFrontBytes, aadhaarBackBytes, pamphletBytes] =
      await Promise.all([
        fetchImageAsBytes(supabase, data.applicant_photo_path),
        fetchImageAsBytes(supabase, data.aadhaar_front_path),
        fetchImageAsBytes(supabase, data.aadhaar_back_path),
        fetchImageAsBytes(supabase, data.pamphlet_image_path),
      ]);

    console.log("Images fetched:", {
      applicantPhoto: !!applicantPhotoBytes,
      aadhaarFront: !!aadhaarFrontBytes,
      aadhaarBack: !!aadhaarBackBytes,
      pamphlet: !!pamphletBytes,
    });

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Page dimensions
    const pageWidth = 595.28; // A4 width
    const pageHeight = 841.89; // A4 height
    const margin = 50;
    const lineHeight = 18;

    // Add first page
    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    // Helper function to draw text
    const drawText = (text: string, x: number, yPos: number, options: any = {}) => {
      const { font = helveticaFont, size = 11, color = rgb(0, 0, 0) } = options;
      page.drawText(text, { x, y: yPos, size, font, color });
    };

    // Helper function to draw a line
    const drawLine = (yPos: number) => {
      page.drawLine({
        start: { x: margin, y: yPos },
        end: { x: pageWidth - margin, y: yPos },
        thickness: 1,
        color: rgb(0.7, 0.7, 0.7),
      });
    };

    // Title
    drawText(labels.title, margin, y, { font: helveticaBold, size: 18, color: rgb(0.4, 0.2, 0.1) });
    y -= 25;
    drawText(labels.subtitle, margin, y, { font: helveticaBold, size: 14, color: rgb(0.5, 0.3, 0.15) });
    y -= 30;
    drawLine(y);
    y -= 25;

    // Embed applicant photo if available
    const applicantPhotoImage = await embedImage(pdfDoc, applicantPhotoBytes, "image/jpeg");
    if (applicantPhotoImage) {
      const imgDims = applicantPhotoImage.scale(0.15);
      const imgWidth = Math.min(imgDims.width, 100);
      const imgHeight = Math.min(imgDims.height, 120);
      page.drawImage(applicantPhotoImage, {
        x: pageWidth - margin - imgWidth,
        y: y - imgHeight + 20,
        width: imgWidth,
        height: imgHeight,
      });
    }

    // Section: Applicant Details
    drawText(labels.applicantDetails, margin, y, { font: helveticaBold, size: 13, color: rgb(0.2, 0.4, 0.6) });
    y -= lineHeight + 5;

    const fields = [
      [labels.memberName, data.member_name || notProvided],
      [labels.guardianName, data.guardian_name || notProvided],
      [labels.gender, data.gender || notProvided],
      [labels.occupation, data.occupation || notProvided],
      [labels.rationCard, data.ration_card || notProvided],
      [labels.annualIncome, data.annual_income || notProvided],
      [labels.aadhaarNumber, data.aadhaar_number || notProvided],
      [labels.mobileNumber, data.mobile_number || notProvided],
      [labels.address, data.address || notProvided],
    ];

    for (const [label, value] of fields) {
      drawText(`${label}:`, margin, y, { font: helveticaBold, size: 10 });
      drawText(String(value), margin + 150, y, { size: 10 });
      y -= lineHeight;
    }

    y -= 10;
    drawLine(y);
    y -= 20;

    // Section: Nominee 1
    drawText(labels.nominee1Title, margin, y, { font: helveticaBold, size: 13, color: rgb(0.2, 0.4, 0.6) });
    y -= lineHeight + 5;

    const nominee1Fields = [
      [labels.nomineeName, data.nominee1_name || notProvided],
      [labels.gender, data.nominee1_gender || notProvided],
      [labels.nomineeAge, data.nominee1_age || notProvided],
      [labels.nomineeRelation, data.nominee1_relation || notProvided],
    ];

    for (const [label, value] of nominee1Fields) {
      drawText(`${label}:`, margin, y, { font: helveticaBold, size: 10 });
      drawText(String(value), margin + 150, y, { size: 10 });
      y -= lineHeight;
    }

    y -= 10;

    // Section: Nominee 2
    drawText(labels.nominee2Title, margin, y, { font: helveticaBold, size: 13, color: rgb(0.2, 0.4, 0.6) });
    y -= lineHeight + 5;

    const nominee2Fields = [
      [labels.nomineeName, data.nominee2_name || notProvided],
      [labels.gender, data.nominee2_gender || notProvided],
      [labels.nomineeAge, data.nominee2_age || notProvided],
      [labels.nomineeRelation, data.nominee2_relation || notProvided],
    ];

    for (const [label, value] of nominee2Fields) {
      drawText(`${label}:`, margin, y, { font: helveticaBold, size: 10 });
      drawText(String(value), margin + 150, y, { size: 10 });
      y -= lineHeight;
    }

    y -= 10;
    drawLine(y);
    y -= 20;

    // Additional Message
    if (data.additional_message && data.additional_message !== "Not Provided") {
      drawText(labels.additionalMessage + ":", margin, y, { font: helveticaBold, size: 10 });
      y -= lineHeight;
      drawText(data.additional_message, margin, y, { size: 10 });
      y -= lineHeight * 2;
    }

    // Add second page for images
    const imagePage = pdfDoc.addPage([pageWidth, pageHeight]);
    let imgY = pageHeight - margin;

    const drawImageTitle = (title: string, yPos: number) => {
      imagePage.drawText(title, {
        x: margin,
        y: yPos,
        size: 12,
        font: helveticaBold,
        color: rgb(0.2, 0.4, 0.6),
      });
    };

    // Aadhaar Front
    drawImageTitle(labels.aadhaarFront, imgY);
    imgY -= 20;
    const aadhaarFrontImage = await embedImage(pdfDoc, aadhaarFrontBytes, "image/jpeg");
    if (aadhaarFrontImage) {
      const dims = aadhaarFrontImage.scale(0.3);
      const w = Math.min(dims.width, 250);
      const h = Math.min(dims.height, 160);
      imagePage.drawImage(aadhaarFrontImage, { x: margin, y: imgY - h, width: w, height: h });
      imgY -= h + 30;
    } else {
      imagePage.drawText(notProvided, { x: margin, y: imgY - 15, size: 10, font: helveticaFont });
      imgY -= 40;
    }

    // Aadhaar Back
    drawImageTitle(labels.aadhaarBack, imgY);
    imgY -= 20;
    const aadhaarBackImage = await embedImage(pdfDoc, aadhaarBackBytes, "image/jpeg");
    if (aadhaarBackImage) {
      const dims = aadhaarBackImage.scale(0.3);
      const w = Math.min(dims.width, 250);
      const h = Math.min(dims.height, 160);
      imagePage.drawImage(aadhaarBackImage, { x: margin, y: imgY - h, width: w, height: h });
      imgY -= h + 30;
    } else {
      imagePage.drawText(notProvided, { x: margin, y: imgY - 15, size: 10, font: helveticaFont });
      imgY -= 40;
    }

    // Pamphlet Image
    drawImageTitle(labels.pamphletImage, imgY);
    imgY -= 20;
    const pamphletImage = await embedImage(pdfDoc, pamphletBytes, "image/jpeg");
    if (pamphletImage) {
      const dims = pamphletImage.scale(0.3);
      const w = Math.min(dims.width, 250);
      const h = Math.min(dims.height, 180);
      imagePage.drawImage(pamphletImage, { x: margin, y: imgY - h, width: w, height: h });
    } else {
      imagePage.drawText(notProvided, { x: margin, y: imgY - 15, size: 10, font: helveticaFont });
    }

    // Save PDF
    const pdfBytes = await pdfDoc.save();
    console.log(`PDF generated, size: ${pdfBytes.length} bytes`);

    // Upload PDF to storage
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
      console.error("PDF upload error:", uploadError);
      throw new Error(`Failed to upload PDF: ${uploadError.message}`);
    }

    console.log(`PDF uploaded to: ${fileName}`);

    // Generate signed URL (7 days = 604800 seconds)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("applications-pdf")
      .createSignedUrl(fileName, 604800);

    if (signedUrlError) {
      console.error("Signed URL error:", signedUrlError);
      throw new Error(`Failed to create signed URL: ${signedUrlError.message}`);
    }

    console.log("Signed URL generated successfully");

    return new Response(
      JSON.stringify({
        success: true,
        pdf_url: signedUrlData.signedUrl,
        file_name: fileName,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in generate-application-pdf:", error);
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
