import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, Loader2 } from 'lucide-react';

interface DocPost {
  id: string;
  title: string;
  title_en: string | null;
  title_ta: string | null;
  pdf_path: string;
  created_at: string;
}

const docsTranslations = {
  en: {
    title: 'Documentations',
    subtitle: 'Official company certificates and documents',
    noDocs: 'No documents available yet.',
    view: 'View',
  },
  ta: {
    title: 'ஆவணங்கள்',
    subtitle: 'அதிகாரப்பூர்வ நிறுவன சான்றிதழ்கள் மற்றும் ஆவணங்கள்',
    noDocs: 'இன்னும் ஆவணங்கள் இல்லை.',
    view: 'பார்க்க',
  },
};

const DocumentationsPage: React.FC = () => {
  const { language } = useLanguage();
  const [docs, setDocs] = useState<DocPost[]>([]);
  const [loading, setLoading] = useState(true);
  const t = docsTranslations[language];

  useEffect(() => {
    const fetchDocs = async () => {
      const { data, error } = await supabase
        .from('documentations')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) setDocs(data as unknown as DocPost[]);
      setLoading(false);
    };
    fetchDocs();
  }, []);

  const getPdfUrl = (path: string) => {
    const { data } = supabase.storage.from('updates-pdf').getPublicUrl(path);
    return data.publicUrl;
  };

  const getTitle = (doc: DocPost) => {
    if (language === 'ta' && doc.title_ta) return doc.title_ta;
    if (language === 'en' && doc.title_en) return doc.title_en;
    return doc.title;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-primary mb-2">{t.title}</h1>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : docs.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <FileText className="h-16 w-16 mx-auto mb-4 opacity-40" />
            <p>{t.noDocs}</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {docs.map((doc) => {
              const pdfUrl = getPdfUrl(doc.pdf_path);
              return (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-5">
                    <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-destructive" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground break-words">{getTitle(doc)}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 sm:flex-none whitespace-nowrap"
                        onClick={() => window.open(pdfUrl, '_blank', 'noopener,noreferrer')}
                      >
                        {t.view}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentationsPage;
