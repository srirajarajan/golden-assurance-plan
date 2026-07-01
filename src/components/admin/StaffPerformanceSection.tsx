import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, Eye } from 'lucide-react';

interface Row {
  user_id: string;
  name: string;
  email: string;
  completed: number;
  status: string;
}

interface Props { language: 'en' | 'ta' }

const StaffPerformanceSection: React.FC<Props> = ({ language }) => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [{ data: profiles }, { data: apps }] = await Promise.all([
          supabase.from('profiles').select('user_id, full_name, email, status').neq('status', 'pending'),
          supabase.from('applications').select('staff_user_id'),
        ]);
        const counts = new Map<string, number>();
        (apps || []).forEach((a: any) => {
          counts.set(a.staff_user_id, (counts.get(a.staff_user_id) || 0) + 1);
        });
        const r: Row[] = (profiles || []).map((p: any) => ({
          user_id: p.user_id,
          name: p.full_name || p.email,
          email: p.email,
          completed: counts.get(p.user_id) || 0,
          status: p.status,
        })).sort((a, b) => b.completed - a.completed);
        setRows(r);
      } finally { setLoading(false); }
    })();
  }, []);

  const t = language === 'ta'
    ? { title: 'ஊழியர் செயல்திறன்', name: 'ஊழியர்', completed: 'நிறைவு', status: 'நிலை', view: 'பார்', empty: 'ஊழியர்கள் இல்லை' }
    : { title: 'Staff Performance', name: 'Staff Name', completed: 'Completed Applications', status: 'Status', view: 'View', empty: 'No staff yet' };

  return (
    <Card className="shadow-xl border-2 mb-6">
      <CardHeader className="bg-primary/5 border-b">
        <CardTitle className="text-xl font-bold text-primary flex items-center gap-2">
          <TrendingUp className="h-5 w-5" /> {t.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : rows.length === 0 ? (
          <p className="text-center py-6 text-muted-foreground">{t.empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left py-3 px-3 font-medium">{t.name}</th>
                  <th className="text-left py-3 px-3 font-medium">{t.completed}</th>
                  <th className="text-left py-3 px-3 font-medium">{t.status}</th>
                  <th className="text-left py-3 px-3 font-medium">{t.view}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.user_id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-3">
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.email}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                        {r.completed}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs capitalize">{r.status}</td>
                    <td className="py-3 px-3">
                      <Button size="sm" variant="outline" onClick={() => navigate(`/admin/staff/${r.user_id}`)}>
                        <Eye className="mr-1 h-3 w-3" /> {t.view}
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
  );
};

export default StaffPerformanceSection;