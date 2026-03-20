import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { FileText, Trash2, Upload, Loader2, FolderOpen } from 'lucide-react';

interface DocPost {
  id: string;
  title: string;
  title_en: string | null;
  title_ta: string | null;
  pdf_path: string;
  created_at: string;
}

const manageTranslations = {
  en: {
    title: 'Manage Documentations',
    titleEn: 'Title (English)',
    titleTa: 'Title (Tamil)',
    titleEnPlaceholder: 'Enter English title',
    titleTaPlaceholder: 'தமிழ் தலைப்பை உள்ளிடவும்',
    selectPdf: 'Select PDF',
    upload: 'Upload',
    uploading: 'Uploading...',
    delete: 'Delete',
    noItems: 'No documentations uploaded yet.',
    success: 'Documentation uploaded successfully',
    deleted: 'Documentation deleted',
    error: 'Error',
    pdfOnly: 'Only PDF files allowed',
    tooLarge: 'File must be under 5MB',
    titleRequired: 'English title is required',
  },
  ta: {
    title: 'ஆவணங்களை நிர்வகிக்க',
    titleEn: 'தலைப்பு (ஆங்கிலம்)',
    titleTa: 'தலைப்பு (தமிழ்)',
    titleEnPlaceholder: 'Enter English title',
    titleTaPlaceholder: 'தமிழ் தலைப்பை உள்ளிடவும்',
    selectPdf: 'PDF தேர்வு செய்க',
    upload: 'பதிவேற்றம்',
    uploading: 'பதிவேற்றுகிறது...',
    delete: 'நீக்கு',
    noItems: 'இன்னும் ஆவணங்கள் பதிவேற்றப்படவில்லை.',
    success: 'ஆவணம் வெற்றிகரமாக பதிவேற்றப்பட்டது',
    deleted: 'ஆவணம் நீக்கப்பட்டது',
    error: 'பிழை',
    pdfOnly: 'PDF கோப்புகள் மட்டுமே அனுமதிக்கப்படும்',
    tooLarge: 'கோப்பு 5MB க்கு கீழ் இருக்க வேண்டும்',
    titleRequired: 'ஆங்கில தலைப்பு தேவை',
  },
};

const ManageDocumentations: React.FC<{ language: 'en' | 'ta' }> = ({ language }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<DocPost[]>([]);
  const [titleEn, setTitleEn] = useState('');
  const [titleTa, setTitleTa] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const t = manageTranslations[language];

  const fetchPosts = async () => {
    const { data } = await (supabase as any)
      .from('documentations')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setPosts(data as DocPost[]);
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== 'application/pdf') {
      toast({ title: t.error, description: t.pdfOnly, variant: 'destructive' });
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast({ title: t.error, description: t.tooLarge, variant: 'destructive' });
      return;
    }
    setFile(f);
  };

  const handleUpload = async () => {
    if (!titleEn.trim()) {
      toast({ title: t.error, description: t.titleRequired, variant: 'destructive' });
      return;
    }
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileName = `doc-${Date.now()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('updates-pdf')
        .upload(fileName, file, { contentType: 'application/pdf' });
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase
        .from('documentations')
        .insert({
          title: titleEn.trim(),
          title_en: titleEn.trim(),
          title_ta: titleTa.trim() || titleEn.trim(),
          pdf_path: fileName,
          uploaded_by: user.id,
        } as any);
      if (insertError) throw insertError;

      toast({ title: t.success });
      setTitleEn('');
      setTitleTa('');
      setFile(null);
      const fileInput = document.getElementById('doc-pdf-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      fetchPosts();
    } catch (err: any) {
      toast({ title: t.error, description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (post: DocPost) => {
    try {
      await supabase.storage.from('updates-pdf').remove([post.pdf_path]);
      await supabase.from('documentations').delete().eq('id', post.id);
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
      toast({ title: t.deleted });
    } catch (err: any) {
      toast({ title: t.error, description: err.message, variant: 'destructive' });
    }
  };

  const getTitle = (post: DocPost) => {
    if (language === 'ta' && post.title_ta) return post.title_ta;
    if (language === 'en' && post.title_en) return post.title_en;
    return post.title;
  };

  return (
    <Card className="max-w-7xl mx-auto mt-6 shadow-xl border-2">
      <CardHeader className="bg-primary/5 border-b">
        <CardTitle className="text-lg font-bold text-primary flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          {t.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="doc-title-en">{t.titleEn}</Label>
            <Input
              id="doc-title-en"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder={t.titleEnPlaceholder}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="doc-title-ta">{t.titleTa}</Label>
            <Input
              id="doc-title-ta"
              value={titleTa}
              onChange={(e) => setTitleTa(e.target.value)}
              placeholder={t.titleTaPlaceholder}
              className="mt-1"
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 w-full">
            <Label htmlFor="doc-pdf-upload">{t.selectPdf}</Label>
            <Input
              id="doc-pdf-upload"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="mt-1"
            />
          </div>
          <Button onClick={handleUpload} disabled={uploading || !file || !titleEn.trim()} className="w-full sm:w-auto">
            {uploading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.uploading}</>
            ) : (
              <><Upload className="mr-2 h-4 w-4" />{t.upload}</>
            )}
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">{t.noItems}</p>
        ) : (
          <div className="space-y-2">
            {posts.map((post) => (
              <div key={post.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-lg border bg-muted/30">
                <FileText className="h-5 w-5 text-destructive flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm break-words">{getTitle(post)}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 text-xs w-full sm:w-auto"
                  onClick={() => handleDelete(post)}
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  {t.delete}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ManageDocumentations;
