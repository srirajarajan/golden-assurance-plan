import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock, User, UserPlus, CheckCircle } from 'lucide-react';

const signupTranslations = {
  en: {
    title: 'Create Account',
    subtitle: 'Register for a new account',
    fullName: 'Full Name',
    fullNamePlaceholder: 'Enter your full name',
    email: 'Email Address',
    emailPlaceholder: 'Enter your email',
    password: 'Password',
    passwordPlaceholder: 'Create a password (min 6 characters)',
    confirmPassword: 'Confirm Password',
    confirmPasswordPlaceholder: 'Confirm your password',
    signUp: 'Create Account',
    signingUp: 'Creating account...',
    hasAccount: 'Already have an account?',
    login: 'Login',
    errorTitle: 'Registration Failed',
    passwordMismatch: 'Passwords do not match',
    passwordTooShort: 'Password must be at least 6 characters',
    emailExists: 'An account with this email already exists',
    successTitle: 'Account Created!',
    successMessage: 'Your account is pending admin approval. You will be notified when approved.',
  },
  ta: {
    title: 'கணக்கை உருவாக்கு',
    subtitle: 'புதிய கணக்கிற்கு பதிவு செய்யவும்',
    fullName: 'முழு பெயர்',
    fullNamePlaceholder: 'உங்கள் முழு பெயரை உள்ளிடவும்',
    email: 'மின்னஞ்சல் முகவரி',
    emailPlaceholder: 'உங்கள் மின்னஞ்சலை உள்ளிடவும்',
    password: 'கடவுச்சொல்',
    passwordPlaceholder: 'கடவுச்சொல்லை உருவாக்கவும் (குறைந்தபட்சம் 6 எழுத்துக்கள்)',
    confirmPassword: 'கடவுச்சொல்லை உறுதிப்படுத்தவும்',
    confirmPasswordPlaceholder: 'உங்கள் கடவுச்சொல்லை உறுதிப்படுத்தவும்',
    signUp: 'கணக்கை உருவாக்கு',
    signingUp: 'கணக்கை உருவாக்குகிறது...',
    hasAccount: 'ஏற்கனவே கணக்கு உள்ளதா?',
    login: 'உள்நுழைக',
    errorTitle: 'பதிவு தோல்வி',
    passwordMismatch: 'கடவுச்சொற்கள் பொருந்தவில்லை',
    passwordTooShort: 'கடவுச்சொல் குறைந்தபட்சம் 6 எழுத்துக்கள் இருக்க வேண்டும்',
    emailExists: 'இந்த மின்னஞ்சலில் ஏற்கனவே கணக்கு உள்ளது',
    successTitle: 'கணக்கு உருவாக்கப்பட்டது!',
    successMessage: 'உங்கள் கணக்கு நிர்வாகி அனுமதிக்காக காத்திருக்கிறது. அனுமதிக்கப்பட்டதும் உங்களுக்கு தெரிவிக்கப்படும்.',
  },
};

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, user, isLoading } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const t = signupTranslations[language];

  useEffect(() => {
    if (user && !isLoading && !isSuccess) {
      navigate('/');
    }
  }, [user, isLoading, isSuccess, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validation
    if (password.length < 6) {
      toast({
        title: t.errorTitle,
        description: t.passwordTooShort,
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: t.errorTitle,
        description: t.passwordMismatch,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await signUp(email, password, fullName);

      if (error) {
        let errorMessage = error.message;
        if (error.message.includes('already registered')) {
          errorMessage = t.emailExists;
        }
        toast({
          title: t.errorTitle,
          description: errorMessage,
          variant: 'destructive',
        });
        return;
      }

      setIsSuccess(true);
      toast({
        title: t.successTitle,
        description: t.successMessage,
      });
    } catch (error) {
      toast({
        title: t.errorTitle,
        description: 'An error occurred. Please try again.',
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

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md shadow-xl border-2">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-primary mb-2">{t.successTitle}</h2>
            <p className="text-muted-foreground mb-6">{t.successMessage}</p>
            <Link to="/login">
              <Button className="w-full">{t.login}</Button>
            </Link>
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
            <UserPlus className="h-6 w-6" />
            {t.title}
          </CardTitle>
          <CardDescription>{t.subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="fullName" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {t.fullName}
              </Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t.fullNamePlaceholder}
                className="mt-1"
                required
              />
            </div>
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
                minLength={6}
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
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.signingUp}
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {t.signUp}
                </>
              )}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              {t.hasAccount}{' '}
              <Link to="/login" className="text-primary font-medium hover:underline">
                {t.login}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignupPage;
