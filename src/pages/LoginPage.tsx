import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock, LogIn, Eye, EyeOff } from 'lucide-react';

const loginTranslations = {
  en: {
    title: 'Login',
    subtitle: 'Sign in to your account',
    email: 'Email Address',
    emailPlaceholder: 'Enter your email',
    password: 'Password',
    passwordPlaceholder: 'Enter your password',
    login: 'Sign In',
    loggingIn: 'Signing in...',
    noAccount: "Don't have an account?",
    signUp: 'Sign Up',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    passwordHelp: 'Passwords are issued by the Super Admin. Contact them if you need access.',
    errorTitle: 'Login Failed',
    invalidCredentials: 'Invalid email or password',
    pendingApproval: 'Your account is pending admin approval',
    rejectedAccount: 'Your account has been rejected',
  },
  ta: {
    title: 'உள்நுழைவு',
    subtitle: 'உங்கள் கணக்கில் உள்நுழையவும்',
    email: 'மின்னஞ்சல் முகவரி',
    emailPlaceholder: 'உங்கள் மின்னஞ்சலை உள்ளிடவும்',
    password: 'கடவுச்சொல்',
    passwordPlaceholder: 'உங்கள் கடவுச்சொல்லை உள்ளிடவும்',
    login: 'உள்நுழைக',
    loggingIn: 'உள்நுழைகிறது...',
    noAccount: 'கணக்கு இல்லையா?',
    signUp: 'பதிவு செய்யவும்',
    showPassword: 'கடவுச்சொல்லைக் காட்டு',
    hidePassword: 'கடவுச்சொல்லை மறை',
    passwordHelp: 'கடவுச்சொல் சூப்பர் நிர்வாகியால் வழங்கப்படும். தேவைப்பட்டால் அவரைத் தொடர்பு கொள்ளவும்.',
    errorTitle: 'உள்நுழைவு தோல்வி',
    invalidCredentials: 'தவறான மின்னஞ்சல் அல்லது கடவுச்சொல்',
    pendingApproval: 'உங்கள் கணக்கு நிர்வாகி அனுமதிக்காக காத்திருக்கிறது',
    rejectedAccount: 'உங்கள் கணக்கு நிராகரிக்கப்பட்டது',
  },
};

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, user, isLoading, checkUserStatus, checkIsAdmin } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const t = loginTranslations[language];

  // Only auto-redirect if user was already logged in on page load
  useEffect(() => {
    const handleExistingSession = async () => {
      if (user && !isLoading && !isSubmitting) {
        const adminStatus = await checkIsAdmin();
        if (adminStatus) {
          navigate('/admin', { replace: true });
          return;
        }
        const status = await checkUserStatus();
        if (status === 'active') {
          navigate('/apply', { replace: true });
        }
      }
    };
    handleExistingSession();
  }, [user, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        toast({
          title: t.errorTitle,
          description: t.invalidCredentials,
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // Only Active accounts may enter the application.
      // Read the status directly from the freshly authenticated session so we
      // never depend on React state that may not have propagated yet.
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData.user?.id;
      const { data: profileRow } = uid
        ? await supabase.from('profiles').select('status').eq('user_id', uid).maybeSingle()
        : { data: null as any };
      const status = profileRow?.status ?? (await checkUserStatus());
      if (status !== 'active') {
        await supabase.auth.signOut();
        const messages: Record<string, string> = {
          pending:
            'Your registration is pending approval. An administrator will review your account shortly.',
          rejected:
            'Your registration request was not approved. Please contact the Super Administrator for assistance.',
          terminated:
            'Your account has been deactivated. Please contact the Super Administrator for assistance.',
        };
        toast({
          title: t.errorTitle,
          description:
            messages[status as string] ||
            'Your account is not active. Please contact the Super Administrator for assistance.',
          variant: 'destructive',
        });
        return;
      }

      // Active account — route by role
      const { data: roleRows } = uid
        ? await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', uid)
            .in('role', ['admin', 'super_admin'])
        : { data: [] as any[] };
      const adminStatus = (roleRows && roleRows.length > 0) || (await checkIsAdmin());
      navigate(adminStatus ? '/admin' : '/apply', { replace: true });
    } catch (error) {
      toast({
        title: t.errorTitle,
        description: t.invalidCredentials,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md shadow-xl border-2">
        <CardHeader className="text-center bg-primary/5 border-b">
          <CardTitle className="text-2xl font-bold text-primary flex items-center justify-center gap-2">
            <LogIn className="h-6 w-6" />
            {t.title}
          </CardTitle>
          <CardDescription>{t.subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
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
            <div>
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                {t.password}
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.passwordPlaceholder}
                className="mt-1"
                required
              />
            </div>
            <div className="text-right">
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                {t.forgotPassword}
              </Link>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.loggingIn}
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  {t.login}
                </>
              )}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              {t.noAccount}{' '}
              <Link to="/signup" className="text-primary font-medium hover:underline">
                {t.signUp}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
