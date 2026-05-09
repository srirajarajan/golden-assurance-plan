export type PlanId = 'silver' | 'gold' | 'platinum';

export interface PlanData {
  id: PlanId;
  code: string;          // e.g. SILVER
  name: string;          // Peace Scheme
  amount: number;        // base amount in INR
  amountLabel: string;   // ₹3,000
  worth: number;
  worthLabel: string;    // ₹15,000
  activation: string;    // From 16th day onwards
  benefits: string[];
  // Fee breakdown for benefits page table
  documentFee: number;
  serviceFee: number;
  gst: number;
  total: number;
}

export const PLANS: PlanData[] = [
  {
    id: 'silver',
    code: 'SILVER',
    name: 'Peace Scheme',
    amount: 3000,
    amountLabel: '₹3,000',
    worth: 15000,
    worthLabel: '₹15,000',
    activation: 'From 16th day onwards',
    benefits: [
      'Heaven Vehicle',
      'Ice Box',
      'Pandal + 50 Chairs',
      'Ritual Items',
      'Food for 30 People',
    ],
    documentFee: 1300,
    serviceFee: 1700,
    gst: 540,
    total: 3540,
  },
  {
    id: 'gold',
    code: 'GOLD',
    name: 'Kanniyam Scheme',
    amount: 6000,
    amountLabel: '₹6,000',
    worth: 25000,
    worthLabel: '₹25,000',
    activation: 'From 32nd day onwards',
    benefits: [
      'Decorated Vehicle',
      'Ice Box',
      'Pandal + 70 Chairs',
      'Melam Service',
      'Food for 60 People',
      'Ritual Materials',
    ],
    documentFee: 2600,
    serviceFee: 3400,
    gst: 1080,
    total: 7080,
  },
  {
    id: 'platinum',
    code: 'PLATINUM',
    name: 'Royal Honor Scheme',
    amount: 10000,
    amountLabel: '₹10,000',
    worth: 40000,
    worthLabel: '₹40,000',
    activation: 'From 64th day onwards',
    benefits: [
      'Golden Vehicle',
      'Premium Flower Decoration',
      'Ice Box',
      'Pandal + Mic Set',
      'Melam Service',
      'Food for 100 People',
      'Ritual Expense Support',
    ],
    documentFee: 3900,
    serviceFee: 6100,
    gst: 1800,
    total: 11800,
  },
];

export const getPlanById = (id?: string | null): PlanData | undefined =>
  PLANS.find((p) => p.id === id);
