import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, ArrowLeft, KeyRound } from 'lucide-react';

const translations = {
  en: {
    title: 'Forgot Password',
    subtitle: 'Enter your registered email to receive a password reset link',
    email: 'Email Address',
    emailPlaceholder: 'Enter your registered email',
    submit: 'Send Reset Link',
    sending: 'Sending...',
    backToLogin: 'Back to Login',
    successTitle: 'Reset Link Sent',
    successMsg: 'If this email is registered, you will receive a password reset link. Check your inbox.',
    errorTitle: 'Error',
    errorMsg: 'Something went wrong. Please try again.',
  },
  ta: {
    title: 'கடவுச்சொல் மறந்துவிட்டதா',
    subtitle: 'கடவுச்சொல் மீட்டமைப்பு இணைப்பைப் பெற உங்கள் பதிவு மின்னஞ்சலை உள்ளிடவும்',
    email: 'மின்னஞ்சல் முகவரி',
    emailPlaceholder: 'உங்கள் பதிவு மின்னஞ்சலை உள்ளிடவும்',
    submit: 'மீட்டமைப்பு இணைப்பை அனுப்பு',
    sending: 'அனுப்புகிறது...',
    backToLogin: 'உள்நுழைவுக்குத் திரும்பு',
    successTitle: 'மீட்டமைப்பு இணைப்பு அனுப்பப்பட்டது',
    successMsg: 'இந்த மின்னஞ்சல் பதிவு செய்யப்பட்டிருந்தால், கடவுச்சொல் மீட்டமைப்பு இணைப்பைப் பெறுவீர்கள்.',
    errorTitle: 'பிழை',
    errorMsg: 'ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும்.',
  },
};

const ForgotPasswordPage: React.FC = () => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const t = translations[language];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSent(true);
      toast({ title: t.successTitle, description: t.successMsg });
    } catch (error) {
      console.error('Reset password error:', error);
      // Always show generic message for security
      toast({ title: t.successTitle, description: t.successMsg });
      setSent(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md shadow-xl border-2">
        <CardHeader className="text-center bg-primary/5 border-b">
          <CardTitle className="text-2xl font-bold text-primary flex items-center justify-center gap-2">
            <KeyRound className="h-6 w-6" />
            {t.title}
          </CardTitle>
          <CardDescription>{t.subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {sent ? (
            <div className="text-center space-y-4">
              <Mail className="h-12 w-12 mx-auto text-primary" />
              <p className="text-muted-foreground">{t.successMsg}</p>
              <Link to="/login">
                <Button variant="outline" className="mt-4">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t.backToLogin}
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {t.email}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  className="mt-1"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.sending}
                  </>
                ) : (
                  t.submit
                )}
              </Button>
              <div className="text-center">
                <Link to="/login" className="text-primary font-medium hover:underline text-sm">
                  <ArrowLeft className="inline mr-1 h-3 w-3" />
                  {t.backToLogin}
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
