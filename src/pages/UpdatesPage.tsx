import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Calendar, Loader2 } from 'lucide-react';

interface UpdatePost {
  id: string;
  title: string;
  pdf_path: string;
  created_at: string;
}

const updatesTranslations = {
  en: {
    title: 'Updates',
    subtitle: 'Company events, financial support, and funeral support activities',
    noUpdates: 'No updates available yet.',
    download: 'Download',
    view: 'View',
  },
  ta: {
    title: 'புதுப்பிப்புகள்',
    subtitle: 'நிறுவன நிகழ்வுகள், நிதி உதவி மற்றும் இறுதிச்சடங்கு உதவி நடவடிக்கைகள்',
    noUpdates: 'இன்னும் புதுப்பிப்புகள் இல்லை.',
    download: 'பதிவிறக்கம்',
    view: 'பார்க்க',
  },
};

const UpdatesPage: React.FC = () => {
  const { language } = useLanguage();
  const [posts, setPosts] = useState<UpdatePost[]>([]);
  const [loading, setLoading] = useState(true);
  const t = updatesTranslations[language];

  useEffect(() => {
    const fetchUpdates = async () => {
      const { data, error } = await supabase
        .from('updates')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) setPosts(data as UpdatePost[]);
      setLoading(false);
    };
    fetchUpdates();
  }, []);

  const getPdfUrl = (path: string) => {
    const { data } = supabase.storage.from('updates-pdf').getPublicUrl(path);
    return data.publicUrl;
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
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <FileText className="h-16 w-16 mx-auto mb-4 opacity-40" />
            <p>{t.noUpdates}</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {posts.map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{post.title}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(post.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <a href={getPdfUrl(post.pdf_path)} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline">
                        {t.view}
                      </Button>
                    </a>
                    <a href={getPdfUrl(post.pdf_path)} download>
                      <Button size="sm">
                        <Download className="mr-1 h-3 w-3" />
                        {t.download}
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdatesPage;
