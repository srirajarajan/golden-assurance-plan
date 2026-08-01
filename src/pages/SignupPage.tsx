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
import { Loader2, Mail, User, UserPlus, CheckCircle, Phone, MapPin } from 'lucide-react';

const signupTranslations = {
  en: {
    title: 'Create Account',
    subtitle: 'Register for a new account',
    fullName: 'Full Name',
    fullNamePlaceholder: 'Enter your full name',
    phone: 'Phone Number',
    phonePlaceholder: 'Enter your phone number',
    district: 'District',
    districtPlaceholder: 'Enter your district',
    email: 'Email Address',
    emailPlaceholder: 'Enter your email',
    signUp: 'Submit Registration Request',
    signingUp: 'Creating account...',
    hasAccount: 'Already have an account?',
    login: 'Login',
    errorTitle: 'Registration Failed',
    successTitle: 'Registration Request Submitted',
    successMessage:
      'Your registration request has been submitted successfully. Please wait for Super Admin approval. Your login password will be assigned by the Super Admin.',
    phoneRequired: 'Phone number is required',
    districtRequired: 'District is required',
    note: 'No password is required. Once the Super Admin approves your request, a secure password will be generated and shared with you.',
  },
  ta: {
    title: 'கணக்கை உருவாக்கு',
    subtitle: 'புதிய கணக்கிற்கு பதிவு செய்யவும்',
    fullName: 'முழு பெயர்',
    fullNamePlaceholder: 'உங்கள் முழு பெயரை உள்ளிடவும்',
    phone: 'தொலைபேசி எண்',
    phonePlaceholder: 'தொலைபேசி எண்ணை உள்ளிடவும்',
    district: 'மாவட்டம்',
    districtPlaceholder: 'மாவட்டத்தை உள்ளிடவும்',
    email: 'மின்னஞ்சல் முகவரி',
    emailPlaceholder: 'உங்கள் மின்னஞ்சலை உள்ளிடவும்',
    signUp: 'பதிவு கோரிக்கையை சமர்ப்பி',
    signingUp: 'கணக்கை உருவாக்குகிறது...',
    hasAccount: 'ஏற்கனவே கணக்கு உள்ளதா?',
    login: 'உள்நுழைக',
    errorTitle: 'பதிவு தோல்வி',
    successTitle: 'பதிவு கோரிக்கை சமர்ப்பிக்கப்பட்டது',
    successMessage:
      'உங்கள் பதிவு கோரிக்கை வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது. சூப்பர் நிர்வாகியின் அனுமதிக்காக காத்திருக்கவும். உங்கள் கடவுச்சொல் சூப்பர் நிர்வாகியால் வழங்கப்படும்.',
    phoneRequired: 'தொலைபேசி எண் தேவை',
    districtRequired: 'மாவட்டம் தேவை',
    note: 'கடவுச்சொல் தேவையில்லை. சூப்பர் நிர்வாகி அனுமதித்ததும் பாதுகாப்பான கடவுச்சொல் உருவாக்கி வழங்கப்படும்.',
  },
};

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [district, setDistrict] = useState('');
  const [email, setEmail] = useState('');
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
    if (!phoneNumber.trim()) {
      toast({ title: t.errorTitle, description: t.phoneRequired, variant: 'destructive' });
      return;
    }
    if (!district.trim()) {
      toast({ title: t.errorTitle, description: t.districtRequired, variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('staff-register', {
        body: {
          email: email.trim().toLowerCase(),
          full_name: fullName.trim(),
          phone_number: phoneNumber.trim(),
          district: district.trim(),
        },
      });

      if (error || (data as any)?.error) {
        toast({
          title: t.errorTitle,
          description: (data as any)?.error || 'An error occurred. Please try again.',
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
              <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {t.phone}
              </Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder={t.phonePlaceholder}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="district" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {t.district}
              </Label>
              <Input
                id="district"
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder={t.districtPlaceholder}
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
            <p className="text-xs text-muted-foreground bg-muted/40 rounded-md p-3">{t.note}</p>
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
