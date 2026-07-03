import type { PlanId } from './plans';

export interface PlanServiceRow {
  no: number;
  service: string;
  description: string;
}

export interface PlanDetailContent {
  tagline: string;          // e.g. "Peaceful Funeral Service – For Economically Weaker Families"
  worthText: string;        // e.g. "Benefits Worth ₹15,000"
  services: PlanServiceRow[];
  memorial: string;         // e.g. "Memorial Service — From the 16th Day Ceremony"
  notes: string[];
  // Column headers for the table
  colNo: string;
  colService: string;
  colDescription: string;
  noteTitle: string;
}

export interface PlanDetailBilingual {
  en: PlanDetailContent;
  ta: PlanDetailContent;
}

export const PLAN_DETAILS: Record<PlanId, PlanDetailBilingual> = {
  silver: {
    en: {
      tagline: 'Peaceful Funeral Service – For Economically Weaker Families',
      worthText: 'Benefits Worth ₹15,000',
      colNo: 'S.No', colService: 'Service', colDescription: 'Description',
      services: [
        { no: 1, service: 'Heaven Vehicle', description: 'Up to 10 km. Additional charges apply beyond 10 km.' },
        { no: 2, service: 'Ritual Expenses', description: 'Shroud cloth, 2 garlands, ritual pot and other pooja materials.' },
        { no: 3, service: 'Ice Box', description: 'Up to 24 hours. Additional charges apply for extra hours.' },
        { no: 4, service: 'Pandal + 50 Chairs', description: 'For 24 hours.' },
        { no: 5, service: 'Fireworks', description: 'Included.' },
      ],
      memorial: 'Memorial Service — From the 16th Day Ceremony',
      noteTitle: 'Note',
      notes: [
        'Drinking water will be provided.',
        'Death Certificate arrangements will be made by William Carey Funeral Services.',
      ],
    },
    ta: {
      tagline: 'அமைதியான இறுதிச் சடங்கு – ஏழை, எளிய குடும்பத்திற்கு',
      worthText: '₹15,000 மதிப்புள்ள பொருட்கள்',
      colNo: 'வ. எண்', colService: 'சேவை', colDescription: 'விவரம்',
      services: [
        { no: 1, service: 'சொர்க்க ரதம்', description: '10 km வரை (கூடுதல் km-க்கு கட்டணம் வசூலிக்கப்படும்.)' },
        { no: 2, service: 'சாமி செலவு', description: 'கோர துணி, மாலை – 2, பானை, இதர பூஜை செலவு' },
        { no: 3, service: 'ஐஸ் பாக்ஸ்', description: '24 மணி நேரத்திற்கு மட்டும் (கூடுதல் மணி நேரத்திற்கு கட்டணம் வசூலிக்கப்படும்.)' },
        { no: 4, service: 'பந்தல் + 50 நாற்காலி', description: '24 மணி நேரம்' },
        { no: 5, service: 'பட்டாசு வகைகள்', description: '—' },
      ],
      memorial: 'நினைவு சேவை — 16-வது நாளிலிருந்து',
      noteTitle: 'குறிப்பு',
      notes: [
        'கூடுதலாக குடிநீர் வைக்கப்படும்.',
        'இறப்பு சான்றிதழ் நிறுவனத்தின் மூலம் வாங்கி கொடுக்கப்படும்.',
      ],
    },
  },
  gold: {
    en: {
      tagline: 'Dignified Funeral Service – For Middle-Class Families',
      worthText: 'Benefits Worth ₹25,000',
      colNo: 'S.No', colService: 'Service', colDescription: 'Description',
      services: [
        { no: 1, service: 'Heaven Vehicle', description: 'Up to 20 km. Additional charges apply beyond 20 km.' },
        { no: 2, service: 'Ritual Expenses', description: 'Shroud cloth, 2 garlands, ritual pot and other pooja materials.' },
        { no: 3, service: 'Ice Box', description: 'Up to 24 hours. Additional charges apply for extra hours.' },
        { no: 4, service: 'Pandal + 70 Chairs', description: 'For 24 hours.' },
        { no: 5, service: 'Fireworks', description: 'Included.' },
        { no: 6, service: 'Traditional Band', description: 'Up to 8 hours. Additional charges apply thereafter.' },
        { no: 7, service: 'Flower Decoration', description: 'Small floral decoration included.' },
        { no: 8, service: 'Tea Arrangement', description: 'For 100 people.' },
        { no: 9, service: 'Drinking Water Cans', description: 'Included.' },
      ],
      memorial: 'Memorial Service — From the 32nd Day Ceremony',
      noteTitle: 'Note',
      notes: ['Death Certificate arrangements will be made by William Carey Funeral Services.'],
    },
    ta: {
      tagline: 'கண்ணியமான இறுதிச் சடங்கு – நடுத்தர குடும்பத்திற்கு',
      worthText: '₹25,000 மதிப்புள்ள பொருட்கள்',
      colNo: 'வ. எண்', colService: 'சேவை', colDescription: 'விவரம்',
      services: [
        { no: 1, service: 'சொர்க்க ரதம்', description: '20 km வரை (கூடுதல் km-க்கு கட்டணம் வசூலிக்கப்படும்.)' },
        { no: 2, service: 'சாமி செலவு', description: 'கோர துணி, மாலை – 2, பானை, இதர பூஜை செலவு' },
        { no: 3, service: 'ஐஸ் பாக்ஸ்', description: '24 மணி நேரத்திற்கு மட்டும் (கூடுதல் மணி நேரத்திற்கு கட்டணம் வசூலிக்கப்படும்.)' },
        { no: 4, service: 'பந்தல் + 70 நாற்காலி', description: '24 மணி நேரம்' },
        { no: 5, service: 'பட்டாசு வகைகள்', description: '—' },
        { no: 6, service: 'மேளம்', description: '8 மணி நேரம் (கூடுதல் மணி நேரத்திற்கு கட்டணம் வசூலிக்கப்படும்.)' },
        { no: 7, service: 'சிறிய பூ அலங்காரம்', description: '—' },
        { no: 8, service: 'டீ செலவு', description: '100 நபர்களுக்கு' },
        { no: 9, service: 'குடிநீர் கேன்', description: '—' },
      ],
      memorial: 'நினைவு சேவை — 32-வது நாளிலிருந்து',
      noteTitle: 'குறிப்பு',
      notes: ['இறப்பு சான்றிதழ் நிறுவனத்தின் மூலம் வாங்கி கொடுக்கப்படும்.'],
    },
  },
  platinum: {
    en: {
      tagline: 'Royal Funeral Service – For VIP Families',
      worthText: 'Benefits Worth ₹40,000',
      colNo: 'S.No', colService: 'Service', colDescription: 'Description',
      services: [
        { no: 1, service: 'Golden Hearse', description: 'Up to 20 km.' },
        { no: 2, service: 'Premium Flower Decoration', description: 'Floral decoration worth ₹5,000.' },
        { no: 3, service: 'Ritual Expenses', description: 'Shroud cloth, 2 garlands, ritual pot and other pooja materials.' },
        { no: 4, service: 'Ice Box', description: 'Up to 24 hours. Additional charges apply thereafter.' },
        { no: 5, service: 'Pandal + 70 Chairs', description: 'For 24 hours.' },
        { no: 6, service: 'Fireworks', description: 'Included.' },
        { no: 7, service: 'Traditional Band', description: 'Up to 8 hours. Additional charges apply thereafter.' },
        { no: 8, service: 'Small Flower Decoration', description: 'Included.' },
        { no: 9, service: 'Tea Arrangement', description: 'For 100 people.' },
        { no: 10, service: 'Drinking Water Cans', description: 'Included.' },
        { no: 11, service: 'Ritual Expense Support', description: 'Priests and ceremonial arrangements.' },
      ],
      memorial: 'Memorial Service — From the 64th Day Ceremony',
      noteTitle: 'Note',
      notes: ['Death Certificate arrangements will be made by William Carey Funeral Services.'],
    },
    ta: {
      tagline: 'ராஜ மரியாதை இறுதிச் சடங்கு – விஐபி குடும்பத்திற்கு',
      worthText: '₹40,000 மதிப்புள்ள பொருட்கள்',
      colNo: 'வ. எண்', colService: 'சேவை', colDescription: 'விவரம்',
      services: [
        { no: 1, service: 'தங்கரதம்', description: '20 km வரை' },
        { no: 2, service: 'பூ அலங்காரம்', description: '₹5,000 மதிப்புள்ள பூ அலங்காரம்' },
        { no: 3, service: 'சாமி செலவு', description: 'கோர துணி, மாலை – 2, பானை, இதர பூஜை செலவு' },
        { no: 4, service: 'ஐஸ் பாக்ஸ்', description: '24 மணி நேரத்திற்கு மட்டும் (கூடுதல் மணி நேரத்திற்கு கட்டணம் வசூலிக்கப்படும்.)' },
        { no: 5, service: 'பந்தல் + 70 நாற்காலி', description: '24 மணி நேரம்' },
        { no: 6, service: 'பட்டாசு வகைகள்', description: '—' },
        { no: 7, service: 'மேளம்', description: '8 மணி நேரம் (கூடுதல் மணி நேரத்திற்கு கட்டணம் வசூலிக்கப்படும்.)' },
        { no: 8, service: 'சிறிய பூ அலங்காரம்', description: '—' },
        { no: 9, service: 'டீ செலவு', description: '100 நபர்களுக்கு' },
        { no: 10, service: 'குடிநீர் கேன்', description: '—' },
        { no: 11, service: 'காரியச் செலவு பங்கு', description: 'சாஸ்திரிகள், சாமான் ஏற்பாடுகள்' },
      ],
      memorial: 'நினைவு சேவை — 64-வது நாளிலிருந்து',
      noteTitle: 'குறிப்பு',
      notes: ['இறப்பு சான்றிதழ் நிறுவனத்தின் மூலம் வாங்கி கொடுக்கப்படும்.'],
    },
  },
};

export const getPlanDetails = (id: PlanId, lang: 'en' | 'ta'): PlanDetailContent =>
  PLAN_DETAILS[id][lang];