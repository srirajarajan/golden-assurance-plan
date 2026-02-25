import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lock, KeyRound, CheckCircle } from 'lucide-react';

const translations = {
  en: {
    title: 'Create New Password',
    subtitle: 'Enter your new password below',
    newPassword: 'New Password',
    newPasswordPlaceholder: 'Enter new password (min 8 chars)',
    confirmPassword: 'Confirm Password',
    confirmPasswordPlaceholder: 'Re-enter your new password',
    submit: 'Update Password',
    updating: 'Updating...',
    successTitle: 'Password Updated',
    successMsg: 'Password updated successfully. Please login.',
    errorTitle: 'Error',
    mismatch: 'Passwords do not match',
    tooShort: 'Password must be at least 8 characters',
    weakPassword: 'Password must include letters and numbers',
    invalidLink: 'Invalid or expired reset link. Please request a new one.',
    goToLogin: 'Go to Login',
  },
  ta: {
    title: 'புதிய கடவுச்சொல் உருவாக்கு',
    subtitle: 'கீழே உங்கள் புதிய கடவுச்சொல்லை உள்ளிடவும்',
    newPassword: 'புதிய கடவுச்சொல்',
    newPasswordPlaceholder: 'புதிய கடவுச்சொல்லை உள்ளிடவும் (குறைந்தது 8 எழுத்துக்கள்)',
    confirmPassword: 'கடவுச்சொல்லை உறுதிப்படுத்து',
    confirmPasswordPlaceholder: 'புதிய கடவுச்சொல்லை மீண்டும் உள்ளிடவும்',
    submit: 'கடவுச்சொல்லை புதுப்பி',
    updating: 'புதுப்பிக்கிறது...',
    successTitle: 'கடவுச்சொல் புதுப்பிக்கப்பட்டது',
    successMsg: 'கடவுச்சொல் வெற்றிகரமாக புதுப்பிக்கப்பட்டது. தயவுசெய்து உள்நுழையவும்.',
    errorTitle: 'பிழை',
    mismatch: 'கடவுச்சொற்கள் பொருந்தவில்லை',
    tooShort: 'கடவுச்சொல் குறைந்தது 8 எழுத்துக்கள் இருக்க வேண்டும்',
    weakPassword: 'கடவுச்சொல்லில் எழுத்துகளும் எண்களும் இருக்க வேண்டும்',
    invalidLink: 'தவறான அல்லது காலாவதியான மீட்டமைப்பு இணைப்பு. புதிய ஒன்றைக் கோருங்கள்.',
    goToLogin: 'உள்நுழைவுக்குச் செல்',
  },
};

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  const t = translations[language];

  useEffect(() => {
    // Check if user arrived via a valid recovery link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      // Check URL hash for recovery type
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get('type');
      
      if (session || type === 'recovery') {
        setIsValidSession(true);
      } else {
        setIsValidSession(false);
      }
    };

    // Listen for auth state changes (recovery link triggers PASSWORD_RECOVERY event)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true);
      }
    });

    checkSession();
    return () => subscription.unsubscribe();
  }, []);

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) return t.tooShort;
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) return t.weakPassword;
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (newPassword !== confirmPassword) {
      toast({ title: t.errorTitle, description: t.mismatch, variant: 'destructive' });
      return;
    }

    const validationError = validatePassword(newPassword);
    if (validationError) {
      toast({ title: t.errorTitle, description: validationError, variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setSuccess(true);
      toast({ title: t.successTitle, description: t.successMsg });
      
      // Sign out so they login with new password
      await supabase.auth.signOut();
    } catch (error: any) {
      toast({ title: t.errorTitle, description: error.message || t.invalidLink, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isValidSession === false) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md shadow-xl border-2">
          <CardContent className="p-6 text-center space-y-4">
            <KeyRound className="h-12 w-12 mx-auto text-destructive" />
            <p className="text-muted-foreground">{t.invalidLink}</p>
            <Button onClick={() => navigate('/login')}>{t.goToLogin}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          {success ? (
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
              <p className="text-muted-foreground">{t.successMsg}</p>
              <Button onClick={() => navigate('/login')}>{t.goToLogin}</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="newPassword" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  {t.newPassword}
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t.newPasswordPlaceholder}
                  className="mt-1"
                  required
                  minLength={8}
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  {t.confirmPassword}
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t.confirmPasswordPlaceholder}
                  className="mt-1"
                  required
                  minLength={8}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.updating}
                  </>
                ) : (
                  t.submit
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
