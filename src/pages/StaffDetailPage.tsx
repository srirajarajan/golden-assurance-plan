import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Download, Loader2, Printer, FileSpreadsheet, FileText, Search, Pencil } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AppRow {
  id: string;
  application_number: string | null;
  serial_number: string;
  member_name: string | null;
  mobile_number: string | null;
  district: string | null;
  submitted_at: string;
  pdf_path: string | null;
}

interface Profile {
  full_name: string | null;
  email: string;
  phone_number: string | null;
  district: string | null;
}

const StaffDetailPage: React.FC = () => {
  const { staffId } = useParams();
  const navigate = useNavigate();
  const { user, isLoading, checkIsAdmin } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [apps, setApps] = useState<AppRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const t = language === 'ta' ? {
    back: 'திரும்பு', apps: 'விண்ணப்பங்கள்', appNo: 'விண்ணப்ப எண்', name: 'பெயர்', mobile: 'மொபைல்',
    date: 'தேதி', view: 'பார்', download: 'பதிவிறக்கு', excel: 'எக்செல்', pdf: 'PDF', print: 'அச்சிடு',
    searchPh: 'தேடு...', empty: 'விண்ணப்பங்கள் இல்லை',
  } : {
    back: 'Back', apps: 'Applications', appNo: 'Application No', name: 'Applicant Name', mobile: 'Mobile',
    date: 'Date', view: 'View', download: 'Download', excel: 'Export Excel', pdf: 'Export PDF', print: 'Print',
    searchPh: 'Search by app number, name or mobile...', empty: 'No applications yet',
  };

  useEffect(() => {
    (async () => {
      if (!user && !isLoading) { navigate('/login'); return; }
      if (!user) return;
      const ok = await checkIsAdmin();
      if (!ok) { navigate('/'); return; }
      if (!staffId) return;
      setLoading(true);
      try {
        const [{ data: prof }, { data: rows }] = await Promise.all([
          supabase.from('profiles').select('full_name, email, phone_number, district').eq('user_id', staffId).maybeSingle(),
          supabase.from('applications').select('id, application_number, serial_number, member_name, mobile_number, district, submitted_at, pdf_path')
            .eq('staff_user_id', staffId).order('submitted_at', { ascending: false }),
        ]);
        setProfile(prof as Profile);
        setApps((rows || []) as AppRow[]);
      } finally { setLoading(false); }
    })();
  }, [staffId, user, isLoading]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return apps;
    return apps.filter((a) => [a.application_number, a.member_name, a.mobile_number]
      .filter(Boolean).some((v) => (v as string).toLowerCase().includes(q)));
  }, [search, apps]);

  const displayNo = (a: AppRow) => a.application_number || a.serial_number;

  const openPdf = async (a: AppRow) => {
    const path = a.pdf_path || `${displayNo(a)}.pdf`;
    const { data, error } = await supabase.storage.from('applications-pdf').createSignedUrl(path, 300);
    if (error || !data) {
      toast({ title: 'Error', description: 'PDF not found', variant: 'destructive' });
      return;
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  const tableRows = () => filtered.map((a) => ({
    'Application No': displayNo(a),
    'Applicant Name': a.member_name || '',
    'Mobile': a.mobile_number || '',
    'District': a.district || '',
    'Date': new Date(a.submitted_at).toLocaleDateString(),
  }));

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(tableRows());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Applications');
    XLSX.writeFile(wb, `${profile?.full_name || 'staff'}-applications.xlsx`);
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.text(`Applications — ${profile?.full_name || profile?.email || ''}`, 14, 14);
    autoTable(doc, {
      startY: 20,
      head: [['App No', 'Name', 'Mobile', 'District', 'Date']],
      body: filtered.map((a) => [displayNo(a), a.member_name || '', a.mobile_number || '', a.district || '', new Date(a.submitted_at).toLocaleDateString()]),
    });
    doc.save(`${profile?.full_name || 'staff'}-applications.pdf`);
  };

  if (isLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8 px-4 print:bg-white print:p-0">
      <div className="max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/admin')} className="mb-4 print:hidden">
          <ArrowLeft className="mr-2 h-4 w-4" /> {t.back}
        </Button>

        <Card className="shadow-xl border-2 mb-4">
          <CardHeader className="bg-primary/5 border-b">
            <CardTitle className="text-2xl font-bold text-primary">{profile?.full_name || profile?.email}</CardTitle>
            <div className="text-sm text-muted-foreground mt-1">
              {profile?.email} • {profile?.phone_number || '—'} • {profile?.district || '—'}
            </div>
            <div className="text-sm mt-2">
              <span className="font-semibold text-primary">{apps.length}</span> {t.apps.toLowerCase()}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-2 mb-4 print:hidden">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder={t.searchPh} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Button variant="outline" onClick={exportExcel}><FileSpreadsheet className="mr-2 h-4 w-4" />{t.excel}</Button>
              <Button variant="outline" onClick={exportPdf}><FileText className="mr-2 h-4 w-4" />{t.pdf}</Button>
              <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />{t.print}</Button>
            </div>

            {filtered.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">{t.empty}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left py-3 px-3 font-medium">{t.appNo}</th>
                      <th className="text-left py-3 px-3 font-medium">{t.name}</th>
                      <th className="text-left py-3 px-3 font-medium">{t.mobile}</th>
                      <th className="text-left py-3 px-3 font-medium">District</th>
                      <th className="text-left py-3 px-3 font-medium">{t.date}</th>
                      <th className="text-left py-3 px-3 font-medium print:hidden">{t.view}</th>
                      <th className="text-left py-3 px-3 font-medium print:hidden">{language === 'ta' ? 'திருத்து' : 'Edit'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((a) => (
                      <tr key={a.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-3 font-mono">{displayNo(a)}</td>
                        <td className="py-3 px-3">{a.member_name || '—'}</td>
                        <td className="py-3 px-3">{a.mobile_number || '—'}</td>
                        <td className="py-3 px-3">{a.district || '—'}</td>
                        <td className="py-3 px-3 text-xs text-muted-foreground">{new Date(a.submitted_at).toLocaleDateString()}</td>
                        <td className="py-3 px-3 print:hidden">
                          <Button size="sm" variant="outline" onClick={() => openPdf(a)}>
                            <Download className="mr-1 h-3 w-3" /> PDF
                          </Button>
                        </td>
                        <td className="py-3 px-3 print:hidden">
                          <Button size="sm" variant="default" onClick={() => navigate(`/apply?edit=${a.id}`)}>
                            <Pencil className="mr-1 h-3 w-3" /> {language === 'ta' ? 'திருத்து' : 'Edit'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StaffDetailPage;