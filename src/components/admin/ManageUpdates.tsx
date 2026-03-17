import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { FileText, Trash2, Upload, Loader2, Newspaper } from 'lucide-react';

interface UpdatePost {
  id: string;
  title: string;
  pdf_path: string;
  created_at: string;
}

const manageTranslations = {
  en: {
    title: 'Manage Updates',
    uploadTitle: 'Title',
    titlePlaceholder: 'Enter update title',
    selectPdf: 'Select PDF',
    upload: 'Upload',
    uploading: 'Uploading...',
    delete: 'Delete',
    noUpdates: 'No updates uploaded yet.',
    success: 'Update uploaded successfully',
    deleted: 'Update deleted',
    error: 'Error',
    pdfOnly: 'Only PDF files allowed',
    tooLarge: 'File must be under 5MB',
    titleRequired: 'Title is required',
  },
  ta: {
    title: 'புதுப்பிப்புகளை நிர்வகிக்க',
    uploadTitle: 'தலைப்பு',
    titlePlaceholder: 'புதுப்பிப்பு தலைப்பை உள்ளிடவும்',
    selectPdf: 'PDF தேர்வு செய்க',
    upload: 'பதிவேற்றம்',
    uploading: 'பதிவேற்றுகிறது...',
    delete: 'நீக்கு',
    noUpdates: 'இன்னும் புதுப்பிப்புகள் பதிவேற்றப்படவில்லை.',
    success: 'புதுப்பிப்பு வெற்றிகரமாக பதிவேற்றப்பட்டது',
    deleted: 'புதுப்பிப்பு நீக்கப்பட்டது',
    error: 'பிழை',
    pdfOnly: 'PDF கோப்புகள் மட்டுமே அனுமதிக்கப்படும்',
    tooLarge: 'கோப்பு 5MB க்கு கீழ் இருக்க வேண்டும்',
    titleRequired: 'தலைப்பு தேவை',
  },
};

const ManageUpdates: React.FC<{ language: 'en' | 'ta' }> = ({ language }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<UpdatePost[]>([]);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const t = manageTranslations[language];

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('updates')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setPosts(data as UpdatePost[]);
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
    if (!title.trim()) {
      toast({ title: t.error, description: t.titleRequired, variant: 'destructive' });
      return;
    }
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('updates-pdf')
        .upload(fileName, file, { contentType: 'application/pdf' });
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase
        .from('updates')
        .insert({ title: title.trim(), pdf_path: fileName, uploaded_by: user.id });
      if (insertError) throw insertError;

      toast({ title: t.success });
      setTitle('');
      setFile(null);
      // Reset file input
      const fileInput = document.getElementById('pdf-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      fetchPosts();
    } catch (err: any) {
      toast({ title: t.error, description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (post: UpdatePost) => {
    try {
      await supabase.storage.from('updates-pdf').remove([post.pdf_path]);
      await supabase.from('updates').delete().eq('id', post.id);
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
      toast({ title: t.deleted });
    } catch (err: any) {
      toast({ title: t.error, description: err.message, variant: 'destructive' });
    }
  };

  return (
    <Card className="max-w-7xl mx-auto mt-6 shadow-xl border-2">
      <CardHeader className="bg-primary/5 border-b">
        <CardTitle className="text-lg font-bold text-primary flex items-center gap-2">
          <Newspaper className="h-5 w-5" />
          {t.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Upload form */}
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1">
            <Label htmlFor="update-title">{t.uploadTitle}</Label>
            <Input
              id="update-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.titlePlaceholder}
              className="mt-1"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="pdf-upload">{t.selectPdf}</Label>
            <Input
              id="pdf-upload"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="mt-1"
            />
          </div>
          <Button onClick={handleUpload} disabled={uploading || !file || !title.trim()}>
            {uploading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.uploading}</>
            ) : (
              <><Upload className="mr-2 h-4 w-4" />{t.upload}</>
            )}
          </Button>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">{t.noUpdates}</p>
        ) : (
          <div className="space-y-2">
            {posts.map((post) => (
              <div key={post.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                <FileText className="h-5 w-5 text-destructive flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{post.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 text-xs"
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

export default ManageUpdates;
