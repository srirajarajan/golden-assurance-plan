const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits(n: number): string {
  if (n < 20) return ones[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return tens[t] + (o ? ' ' + ones[o] : '');
}

function threeDigits(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  let str = '';
  if (h) str += ones[h] + ' Hundred';
  if (rest) str += (h ? ' ' : '') + twoDigits(rest);
  return str;
}

export function numberToIndianWords(num: number): string {
  if (num === 0) return 'Zero Rupees Only';
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const hundred = rupees % 1000;

  let out = '';
  if (crore) out += threeDigits(crore) + ' Crore ';
  if (lakh) out += threeDigits(lakh) + ' Lakh ';
  if (thousand) out += threeDigits(thousand) + ' Thousand ';
  if (hundred) out += threeDigits(hundred);
  out = out.trim() + ' Rupees';
  if (paise) out += ' and ' + twoDigits(paise) + ' Paise';
  out += ' Only';
  return out.toUpperCase();
}