import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PLANS, getPlanById, PlanId } from '@/data/plans';
import { numberToIndianWords } from '@/lib/numberToWords';
import logo from '@/assets/logo.png';
import {
  Loader2, Printer, Download, ArrowLeft, FileText, Search, Trash2, Eye, RefreshCw, Plus,
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface InvoiceRow {
  id: string;
  invoice_number: string;
  customer_name: string;
  mobile: string;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  plan_type: string;
  amount: number;
  total_amount: number;
  invoice_date: string;
  service_date: string | null;
  created_at: string;
}

const COMPANY = {
  name: 'William Carey Funeral Services Pvt. Ltd.',
  website: 'www.williamcareyfuneralservices.com',
  email: 'williamcareyfuneral99@gmail.com',
  phone: '9600350889',
  address: 'RR Complex, Kannankurichi Main Road, Chinnathirupathi, Salem - 636008',
};

const BANK_HDFC = {
  name: 'HDFC Bank',
  branch: 'C/O Rajaji Road, Salem',
  account: '50200116002261',
  ifsc: 'HDFC0004649',
};
const BANK_EQUITAS = {
  name: 'Equitas Small Finance Bank',
  branch: 'Ramakrishna Road, Salem',
  account: '209600350699',
  ifsc: 'ESFB0001091',
};
const getBankForPlan = (planId?: string) =>
  planId === 'platinum' ? BANK_EQUITAS : BANK_HDFC;

const DOCUMENTATION_FEE = 1000;
const GST_PAID_BY_COMPANY = 180;
const getServiceCharge = (total: number) => total - DOCUMENTATION_FEE;

type Mode = 'list' | 'create' | 'view';

const InvoiceGeneratorPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading, checkIsAdmin } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState<Mode>('list');
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState<InvoiceRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [nextNumber, setNextNumber] = useState<string>('');

  // form
  const [customerName, setCustomerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Tamil Nadu');
  const [pincode, setPincode] = useState('');
  const [planType, setPlanType] = useState<PlanId | ''>('');
  const [invoiceDate, setInvoiceDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [serviceDate, setServiceDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

  const printRef = useRef<HTMLDivElement>(null);

  // Auth gate
  useEffect(() => {
    (async () => {
      if (!user && !isLoading) { navigate('/login'); return; }
      if (user && !isLoading) {
        const ok = await checkIsAdmin();
        if (!ok) { navigate('/'); return; }
        await fetchInvoices();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoading]);

  const fetchInvoices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setInvoices((data as any) || []);
    }
    setLoading(false);
  };

  const fetchNextNumber = async () => {
    const { data, error } = await supabase.rpc('generate_invoice_number');
    if (!error && data) setNextNumber(data as string);
  };

  const openCreate = () => {
    setMode('create');
    setCustomerName(''); setMobile(''); setAddress(''); setCity('');
    setState('Tamil Nadu'); setPincode(''); setPlanType('');
    setInvoiceDate(new Date().toISOString().slice(0, 10));
    setServiceDate(new Date().toISOString().slice(0, 10));
    fetchNextNumber();
  };

  const selectedPlan = useMemo(() => (planType ? getPlanById(planType) : undefined), [planType]);
  const amount = selectedPlan?.amount ?? 0;

  const validate = (): string | null => {
    if (!customerName.trim()) return 'Customer name is required';
    if (!/^\d{10}$/.test(mobile)) return 'Mobile must be exactly 10 digits';
    if (!planType) return 'Please select a plan';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { toast({ title: 'Validation', description: err, variant: 'destructive' }); return; }
    if (!selectedPlan) return;
    setSaving(true);
    try {
      const { data: numData, error: numErr } = await supabase.rpc('generate_invoice_number');
      if (numErr) throw numErr;
      const invoice_number = (numData as string) || nextNumber;

      const { data, error } = await supabase
        .from('invoices')
        .insert({
          invoice_number,
          customer_name: customerName.trim(),
          mobile,
          address: address || null,
          city: city || null,
          state: state || null,
          pincode: pincode || null,
          plan_type: selectedPlan.id,
          amount: selectedPlan.amount,
          total_amount: selectedPlan.amount,
          invoice_date: invoiceDate,
          service_date: serviceDate || null,
          created_by: user?.id || null,
        })
        .select()
        .single();
      if (error) throw error;
      toast({ title: 'Invoice created', description: invoice_number });
      await fetchInvoices();
      setViewing(data as any);
      setMode('view');
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!printRef.current || !viewing) return;
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
      const img = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;
      const h = imgH > pageH ? pageH : imgH;
      pdf.addImage(img, 'PNG', 0, 0, imgW, h);
      pdf.save(`${viewing.invoice_number}.pdf`);
    } catch (e: any) {
      toast({ title: 'PDF Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (inv: InvoiceRow) => {
    if (!window.confirm(`Delete invoice ${inv.invoice_number}?`)) return;
    const { error } = await supabase.from('invoices').delete().eq('id', inv.id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Deleted', description: inv.invoice_number });
    setInvoices((prev) => prev.filter((x) => x.id !== inv.id));
  };

  const filteredInvoices = invoices.filter((i) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      i.invoice_number.toLowerCase().includes(q) ||
      i.customer_name.toLowerCase().includes(q) ||
      i.mobile.includes(q) ||
      i.plan_type.toLowerCase().includes(q)
    );
  });

  // Build a "preview" invoice from form data (when creating, before save)
  const previewInvoice: InvoiceRow | null = useMemo(() => {
    if (mode !== 'create' || !selectedPlan) return null;
    return {
      id: 'preview',
      invoice_number: nextNumber || 'WC-XXXX',
      customer_name: customerName || '—',
      mobile: mobile || '—',
      address, city, state, pincode,
      plan_type: selectedPlan.id,
      amount: selectedPlan.amount,
      total_amount: selectedPlan.amount,
      invoice_date: invoiceDate,
      service_date: serviceDate,
      created_at: new Date().toISOString(),
    } as InvoiceRow;
  }, [mode, selectedPlan, nextNumber, customerName, mobile, address, city, state, pincode, invoiceDate, serviceDate]);

  const invoiceToRender = mode === 'view' ? viewing : previewInvoice;

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8 px-4 print:bg-white print:p-0">
      <div className="max-w-7xl mx-auto print:max-w-none">
        {/* Toolbar — hidden in print */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 no-print">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Admin
            </Button>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-primary flex items-center gap-2">
              <FileText className="h-7 w-7" /> Invoice Generator
            </h1>
          </div>
          <div className="flex gap-2">
            {mode === 'list' && (
              <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> New Invoice</Button>
            )}
            {(mode === 'create' || mode === 'view') && (
              <Button variant="outline" onClick={() => { setMode('list'); setViewing(null); }}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to History
              </Button>
            )}
          </div>
        </div>

        {/* LIST MODE */}
        {mode === 'list' && (
          <Card className="shadow-xl border-2 no-print">
            <CardHeader className="bg-primary/5 border-b flex flex-row items-center justify-between">
              <CardTitle>Invoice History</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-8" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : filteredInvoices.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
                  <p>No invoices yet. Click "New Invoice" to create one.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30">
                      <tr className="border-b">
                        <th className="text-left px-4 py-3">Invoice #</th>
                        <th className="text-left px-4 py-3">Customer</th>
                        <th className="text-left px-4 py-3">Mobile</th>
                        <th className="text-left px-4 py-3">Plan</th>
                        <th className="text-right px-4 py-3">Amount</th>
                        <th className="text-left px-4 py-3">Date</th>
                        <th className="text-right px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvoices.map((inv) => (
                        <tr key={inv.id} className="border-b hover:bg-muted/30">
                          <td className="px-4 py-3 font-mono font-semibold text-primary">{inv.invoice_number}</td>
                          <td className="px-4 py-3">{inv.customer_name}</td>
                          <td className="px-4 py-3 font-mono">{inv.mobile}</td>
                          <td className="px-4 py-3 capitalize">{inv.plan_type}</td>
                          <td className="px-4 py-3 text-right font-semibold">₹{Number(inv.total_amount).toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(inv.invoice_date).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="outline" onClick={() => { setViewing(inv); setMode('view'); }}>
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDelete(inv)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* CREATE MODE — form + live preview */}
        {mode === 'create' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print">
            <Card className="shadow-xl border-2">
              <CardHeader className="bg-primary/5 border-b">
                <CardTitle>Customer & Service Details</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label>Invoice Number</Label>
                    <Input value={nextNumber || 'Auto-generating…'} readOnly className="font-mono bg-muted/40" />
                  </div>
                  <div className="col-span-2">
                    <Label>Customer Name *</Label>
                    <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                  </div>
                  <div>
                    <Label>Mobile (10 digits) *</Label>
                    <Input value={mobile} maxLength={10} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))} />
                  </div>
                  <div>
                    <Label>Pincode</Label>
                    <Input value={pincode} maxLength={6} onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))} />
                  </div>
                  <div className="col-span-2">
                    <Label>Address</Label>
                    <Input value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>
                  <div>
                    <Label>City</Label>
                    <Input value={city} onChange={(e) => setCity(e.target.value)} />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Input value={state} onChange={(e) => setState(e.target.value)} />
                  </div>
                  <div>
                    <Label>Invoice Date</Label>
                    <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
                  </div>
                  <div>
                    <Label>Service Start Date</Label>
                    <Input type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <Label>Plan *</Label>
                    <Select value={planType} onValueChange={(v) => setPlanType(v as PlanId)}>
                      <SelectTrigger><SelectValue placeholder="Select a plan" /></SelectTrigger>
                      <SelectContent>
                        {PLANS.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.code} — {p.amountLabel}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedPlan && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Auto amount: <span className="font-semibold text-foreground">{selectedPlan.amountLabel}</span> (not editable)
                      </p>
                    )}
                  </div>
                </div>

                <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
                  {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</> : <>Save & Generate Invoice</>}
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-2 overflow-hidden">
              <CardHeader className="bg-primary/5 border-b">
                <CardTitle>Live Preview</CardTitle>
              </CardHeader>
              <CardContent className="p-2 bg-muted/30">
                <div className="bg-white p-4 max-h-[800px] overflow-auto">
                  {invoiceToRender ? <InvoiceDocument invoice={invoiceToRender} /> : (
                    <p className="text-center text-muted-foreground py-12">Select a plan to preview the invoice.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* VIEW MODE — full printable */}
        {mode === 'view' && viewing && (
          <>
            <div className="flex justify-end gap-2 mb-4 no-print">
              <Button onClick={handlePrint} variant="outline"><Printer className="h-4 w-4 mr-2" /> Print Invoice</Button>
              <Button onClick={handleDownloadPdf}><Download className="h-4 w-4 mr-2" /> Download PDF</Button>
              <Button variant="outline" onClick={openCreate}><RefreshCw className="h-4 w-4 mr-2" /> New</Button>
            </div>
            <div ref={printRef} className="bg-white shadow-xl mx-auto print:shadow-none" style={{ maxWidth: '210mm' }}>
              <InvoiceDocument invoice={viewing} />
            </div>
          </>
        )}
      </div>

      {/* Hidden printable area when viewing — also covered by global print css */}
      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          html, body { background: #ffffff !important; }
          header, footer, nav, .no-print { display: none !important; }
          .min-h-screen { min-height: auto !important; padding: 0 !important; background: #ffffff !important; }
          .invoice-container { box-shadow: none !important; width: 100% !important; margin: 0 !important; }
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
        .invoice-container, .invoice-container * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
      `}</style>
    </div>
  );
};

/* ------------------------- Invoice Document ------------------------- */

const InvoiceDocument: React.FC<{ invoice: InvoiceRow }> = ({ invoice }) => {
  const plan = getPlanById(invoice.plan_type);
  const serviceName = plan ? `${plan.code.charAt(0)}${plan.code.slice(1).toLowerCase()} Funeral Service Plan` : invoice.plan_type;
  const amount = Number(invoice.total_amount);
  const words = numberToIndianWords(amount);
  const BANK = getBankForPlan(invoice.plan_type);

  return (
    <div className="invoice-container text-[#222] font-sans bg-white" style={{ padding: '14mm 12mm', minHeight: '270mm' }}>
      {/* Header */}
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b-2 border-primary pb-4">
        {/* Left: Logo */}
        <div className="flex items-center justify-start">
          <img src={logo} alt="William Carey" className="w-20 h-20 object-contain" />
        </div>
        {/* Center: Company details */}
        <div className="text-center px-2">
          <h1 className="font-display text-xl md:text-2xl font-bold text-primary leading-tight">
            {COMPANY.name}
          </h1>
          <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">
            {COMPANY.address}
          </p>
        </div>
        {/* Right: Contact */}
        <div className="text-right text-[11px] leading-relaxed whitespace-nowrap">
          <div className="flex items-center justify-end gap-1.5">
            <span aria-hidden>📞</span>
            <a href={`tel:${COMPANY.phone}`} className="text-foreground no-underline">{COMPANY.phone}</a>
          </div>
          <div className="flex items-center justify-end gap-1.5">
            <span aria-hidden>🌐</span>
            <a
              href={`https://${COMPANY.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              {COMPANY.website}
            </a>
          </div>
          <div className="flex items-center justify-end gap-1.5">
            <span aria-hidden>✉</span>
            <a href={`mailto:${COMPANY.email}`} className="text-primary underline">
              {COMPANY.email}
            </a>
          </div>
        </div>
      </div>

      {/* Title bar */}
      <div className="flex items-center justify-between my-4">
        <h2 className="text-2xl font-bold tracking-wide text-primary">INVOICE</h2>
        <div className="text-xs uppercase font-semibold text-muted-foreground">Original for Recipient</div>
      </div>

      {/* Customer + Invoice grid */}
      <div className="grid grid-cols-2 border border-gray-300 text-sm">
        <div className="p-3 border-r border-gray-300">
          <div className="font-semibold text-primary mb-2 border-b pb-1">Customer Details</div>
          <table className="w-full text-xs">
            <tbody>
              <tr><td className="font-semibold pr-2 py-0.5 align-top w-24">Name</td><td>{invoice.customer_name}</td></tr>
              <tr><td className="font-semibold pr-2 py-0.5 align-top">Mobile</td><td>{invoice.mobile}</td></tr>
              <tr><td className="font-semibold pr-2 py-0.5 align-top">Address</td><td>{invoice.address || '—'}</td></tr>
              <tr><td className="font-semibold pr-2 py-0.5 align-top">City</td><td>{invoice.city || '—'}</td></tr>
              <tr><td className="font-semibold pr-2 py-0.5 align-top">State</td><td>{invoice.state || '—'}</td></tr>
              <tr><td className="font-semibold pr-2 py-0.5 align-top">Pincode</td><td>{invoice.pincode || '—'}</td></tr>
            </tbody>
          </table>
        </div>
        <div className="p-3 text-xs">
          <div className="font-semibold text-primary mb-2 border-b pb-1">Invoice Details</div>
          <table className="w-full">
            <tbody>
              <tr><td className="font-semibold pr-2 py-0.5 w-32">Invoice No.</td><td className="font-mono">{invoice.invoice_number}</td></tr>
              <tr><td className="font-semibold pr-2 py-0.5">Invoice Date</td><td>{new Date(invoice.invoice_date).toLocaleDateString('en-IN')}</td></tr>
              <tr><td className="font-semibold pr-2 py-0.5">Service Start Date</td><td>{invoice.service_date ? new Date(invoice.service_date).toLocaleDateString('en-IN') : '—'}</td></tr>
              <tr><td className="font-semibold pr-2 py-0.5">Plan Type</td><td className="capitalize">{invoice.plan_type}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Service table */}
      <table className="w-full border border-gray-300 mt-4 text-sm">
        <thead className="bg-primary/10">
          <tr className="border-b border-gray-300">
            <th className="text-left px-3 py-2 w-14">S.No</th>
            <th className="text-left px-3 py-2">Name of Service</th>
            <th className="text-center px-3 py-2 w-16">Qty</th>
            <th className="text-right px-3 py-2 w-28">Rate</th>
            <th className="text-right px-3 py-2 w-28">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-300">
            <td className="px-3 py-2 align-top">1</td>
            <td className="px-3 py-2 font-semibold align-top">Service Plan Charge<div className="text-xs font-normal text-muted-foreground">{serviceName}</div></td>
            <td className="px-3 py-2 text-center align-top">1</td>
            <td className="px-3 py-2 text-right font-mono align-top">₹{getServiceCharge(amount).toLocaleString('en-IN')}.00</td>
            <td className="px-3 py-2 text-right font-mono align-top">₹{getServiceCharge(amount).toLocaleString('en-IN')}.00</td>
          </tr>
          <tr className="border-b border-gray-300">
            <td className="px-3 py-2 align-top">2</td>
            <td className="px-3 py-2 font-semibold align-top">Documentation Charge</td>
            <td className="px-3 py-2 text-center align-top">1</td>
            <td className="px-3 py-2 text-right font-mono align-top">₹{DOCUMENTATION_FEE.toLocaleString('en-IN')}.00</td>
            <td className="px-3 py-2 text-right font-mono align-top">₹{DOCUMENTATION_FEE.toLocaleString('en-IN')}.00</td>
          </tr>
          <tr className="border-b border-gray-300">
            <td className="px-3 py-2 align-top">3</td>
            <td className="px-3 py-2 font-semibold align-top text-green-700">GST Paid by Company</td>
            <td className="px-3 py-2 text-center align-top">1</td>
            <td className="px-3 py-2 text-right font-mono align-top text-green-700">-₹{GST_PAID_BY_COMPANY.toLocaleString('en-IN')}.00</td>
            <td className="px-3 py-2 text-right font-mono align-top text-green-700">-₹{GST_PAID_BY_COMPANY.toLocaleString('en-IN')}.00</td>
          </tr>
          {Array.from({ length: 2 }).map((_, i) => (
            <tr key={i} className="border-b border-gray-200"><td colSpan={5} className="px-3 py-3">&nbsp;</td></tr>
          ))}
          <tr className="bg-primary text-primary-foreground font-bold text-base">
            <td colSpan={4} className="px-3 py-2 text-right">Grand Total</td>
            <td className="px-3 py-2 text-right font-mono">₹{amount.toLocaleString('en-IN')}.00</td>
          </tr>
        </tbody>
      </table>

      {/* GST note */}
      <div className="border border-t-0 border-gray-300 p-2 text-[11px] italic text-muted-foreground bg-green-50">
        GST on documentation charges has been paid by William Carey Funeral Services Pvt. Ltd. and is not charged to the customer.
      </div>

      {/* Total in words */}
      <div className="border border-t-0 border-gray-300 p-3 text-sm">
        <div className="font-semibold text-primary mb-1">Total in Words</div>
        <div className="font-semibold">{words}</div>
      </div>

      {/* Bank + Signature */}
      <div className="grid grid-cols-2 mt-4 border border-gray-300 text-sm">
        <div className="p-3 border-r border-gray-300">
          <div className="font-semibold text-primary mb-2 border-b pb-1">Bank Details</div>
          <table className="w-full text-xs">
            <tbody>
              <tr><td className="font-semibold pr-2 py-0.5 w-28">Bank Name</td><td>{BANK.name}</td></tr>
              <tr><td className="font-semibold pr-2 py-0.5">Branch</td><td>{BANK.branch}</td></tr>
              <tr><td className="font-semibold pr-2 py-0.5">A/C Number</td><td className="font-mono">{BANK.account}</td></tr>
              <tr><td className="font-semibold pr-2 py-0.5">IFSC</td><td className="font-mono">{BANK.ifsc}</td></tr>
            </tbody>
          </table>
        </div>
        <div className="p-3 flex flex-col justify-between">
          <div className="text-xs text-right text-muted-foreground italic">
            Certified that the particulars given above are true and correct.
          </div>
          <div className="text-right mt-6">
            <div className="font-semibold text-primary">For {COMPANY.name}</div>
            <div className="h-12" />
            <div className="border-t border-gray-400 inline-block px-8 pt-1 text-xs">Authorized Signatory</div>
          </div>
        </div>
      </div>

      <div className="text-center text-[10px] text-muted-foreground mt-6 border-t pt-2">
        Thank you for trusting William Carey Funeral Services Pvt. Ltd.
      </div>
    </div>
  );
};

export default InvoiceGeneratorPage;