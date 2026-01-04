import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { User, Phone, CreditCard, IndianRupee, MapPin, Briefcase, Users, Shield } from 'lucide-react';
import logo from '@/assets/logo.png';
import officialSeal from '@/assets/official-seal.jpg';
import { supabase } from '@/integrations/supabase/client';

const ApplicationPage = () => {
  const { language, t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Convert image to base64
  const getImageBase64 = async (imageSrc: string): Promise<string> => {
    try {
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      return '';
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      // Get seal image as base64 for attachment (optional)
      let sealBase64 = '';
      try {
        sealBase64 = await getImageBase64('/official-seal.jpg');
      } catch (err) {
        console.log('Seal image not available, continuing without it');
      }

      // Build application data object - only include non-empty values
      const applicationData = {
        applicant_name: (formData.get('applicant_name') as string) || '',
        guardian_name: (formData.get('guardian_name') as string) || '',
        gender: (formData.get('gender') as string) || '',
        occupation: (formData.get('occupation') as string) || '',
        ration_card: (formData.get('ration_card') as string) || '',
        annual_income: (formData.get('annual_income') as string) || '',
        aadhaar: (formData.get('aadhaar') as string) || '',
        address: (formData.get('address') as string) || '',
        phone: (formData.get('phone') as string) || '',
        nominee1_name: (formData.get('nominee1_name') as string) || '',
        nominee1_gender: (formData.get('nominee1_gender') as string) || '',
        nominee1_age: (formData.get('nominee1_age') as string) || '',
        nominee1_relation: (formData.get('nominee1_relation') as string) || '',
        nominee2_name: (formData.get('nominee2_name') as string) || '',
        nominee2_gender: (formData.get('nominee2_gender') as string) || '',
        nominee2_age: (formData.get('nominee2_age') as string) || '',
        nominee2_relation: (formData.get('nominee2_relation') as string) || '',
        seal_base64: sealBase64,
        language: language,
      };

      console.log('Submitting application:', applicationData);

      const { data, error } = await supabase.functions.invoke('send-membership-application', {
        body: applicationData,
      });

      console.log('Response:', data, error);

      if (error) throw error;

      setIsSuccess(true);
      toast({
        title: t.form.successTitle,
        description: t.form.successMessage,
      });
      form.reset();
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: t.form.errorTitle,
        description: t.form.errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <main className="min-h-screen py-12 md:py-20 bg-muted/30 flex items-center justify-center">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto text-center card-elevated p-10 gold-border">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-secondary mb-4">
              {t.form.successTitle}
            </h2>
            <p className="text-muted-foreground text-lg">
              {t.form.successMessage}
            </p>
            <Button
              onClick={() => setIsSuccess(false)}
              className="mt-6"
            >
              {t.form.newApplication}
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-12 md:py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <img src={logo} alt="William Carey Funeral Insurance" className="w-20 h-20 mx-auto mb-4 object-contain" />
            <h1 className="font-display text-2xl md:text-3xl font-bold text-secondary mb-2">
              William Carey Funeral Insurance
            </h1>
            <p className="text-lg text-muted-foreground">
              {t.form.subtitle}
            </p>
            <div className="w-24 h-1 bg-primary mx-auto rounded-full mt-4" />
          </div>

          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="card-elevated p-6 md:p-10 gold-border animate-slide-up space-y-8"
          >
            {/* Applicant Details Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <User className="text-primary" size={20} />
                <h2 className="font-display text-xl font-semibold text-secondary">
                  {t.form.applicantDetails}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Applicant Name */}
                <div className="space-y-2">
                  <Label htmlFor="applicant_name">
                    {t.form.memberName} <span className="text-destructive">{t.form.required}</span>
                  </Label>
                  <Input
                    id="applicant_name"
                    name="applicant_name"
                    required
                    className="rounded-xl"
                    placeholder={t.form.memberNamePlaceholder}
                  />
                </div>

                {/* Guardian Name */}
                <div className="space-y-2">
                  <Label htmlFor="guardian_name">
                    {t.form.fatherHusbandName}
                  </Label>
                  <Input
                    id="guardian_name"
                    name="guardian_name"
                    className="rounded-xl"
                    placeholder={t.form.fatherHusbandPlaceholder}
                  />
                </div>

                {/* Gender */}
                <div className="space-y-2">
                  <Label htmlFor="gender">
                    {t.form.gender}
                  </Label>
                  <Select name="gender">
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder={t.form.selectGender} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">{t.form.male}</SelectItem>
                      <SelectItem value="female">{t.form.female}</SelectItem>
                      <SelectItem value="other">{t.form.other}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Occupation */}
                <div className="space-y-2">
                  <Label htmlFor="occupation" className="flex items-center gap-2">
                    <Briefcase size={14} className="text-primary" />
                    {t.form.occupation}
                  </Label>
                  <Input
                    id="occupation"
                    name="occupation"
                    className="rounded-xl"
                    placeholder={t.form.occupationPlaceholder}
                  />
                </div>

                {/* Ration Card Number */}
                <div className="space-y-2">
                  <Label htmlFor="ration_card" className="flex items-center gap-2">
                    <CreditCard size={14} className="text-primary" />
                    {t.form.rationCard} <span className="text-destructive">{t.form.required}</span>
                  </Label>
                  <Input
                    id="ration_card"
                    name="ration_card"
                    required
                    className="rounded-xl"
                    placeholder={t.form.rationCardPlaceholder}
                  />
                </div>

                {/* Annual Income Dropdown */}
                <div className="space-y-2">
                  <Label htmlFor="annual_income" className="flex items-center gap-2">
                    <IndianRupee size={14} className="text-primary" />
                    {t.form.annualIncome} <span className="text-destructive">{t.form.required}</span>
                  </Label>
                  <Select name="annual_income" required>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder={t.form.selectIncome} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="below_175000">{t.form.belowIncome}</SelectItem>
                      <SelectItem value="above_175000">{t.form.aboveIncome}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">{t.form.annualIncomeHelper}</p>
                </div>

                {/* Aadhaar Number */}
                <div className="space-y-2">
                  <Label htmlFor="aadhaar" className="flex items-center gap-2">
                    <Shield size={14} className="text-primary" />
                    {t.form.aadharCard}
                  </Label>
                  <Input
                    id="aadhaar"
                    name="aadhaar"
                    className="rounded-xl"
                    placeholder={t.form.aadharPlaceholder}
                    maxLength={14}
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone size={14} className="text-primary" />
                    {t.form.phone} <span className="text-destructive">{t.form.required}</span>
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    className="rounded-xl"
                    placeholder={t.form.phonePlaceholder}
                  />
                </div>
              </div>

              {/* Address - Full Width */}
              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin size={14} className="text-primary" />
                  {t.form.permanentAddress}
                </Label>
                <Textarea
                  id="address"
                  name="address"
                  className="rounded-xl min-h-[80px]"
                  placeholder={t.form.addressPlaceholder}
                />
              </div>
            </div>

            {/* Nominee Details Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Users className="text-primary" size={20} />
                <h2 className="font-display text-xl font-semibold text-secondary">
                  {t.form.nomineeSection}
                </h2>
              </div>

              {/* Nominee 1 */}
              <div className="space-y-4 p-4 bg-muted/50 rounded-xl">
                <h3 className="font-medium text-secondary">{t.form.nominee1Title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nominee1_name">{t.form.name}</Label>
                    <Input
                      id="nominee1_name"
                      name="nominee1_name"
                      className="rounded-xl"
                      placeholder={t.form.nomineePlaceholder}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nominee1_gender">{t.form.gender}</Label>
                    <Select name="nominee1_gender">
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder={t.form.selectGender} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">{t.form.male}</SelectItem>
                        <SelectItem value="female">{t.form.female}</SelectItem>
                        <SelectItem value="other">{t.form.other}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nominee1_age">{t.form.age}</Label>
                    <Input
                      id="nominee1_age"
                      name="nominee1_age"
                      type="number"
                      className="rounded-xl"
                      placeholder={t.form.agePlaceholder}
                      min={1}
                      max={120}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nominee1_relation">{t.form.relation}</Label>
                    <Input
                      id="nominee1_relation"
                      name="nominee1_relation"
                      className="rounded-xl"
                      placeholder={t.form.relationPlaceholder}
                    />
                  </div>
                </div>
              </div>

              {/* Nominee 2 */}
              <div className="space-y-4 p-4 bg-muted/30 rounded-xl">
                <h3 className="font-medium text-muted-foreground">{t.form.nominee2Title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nominee2_name">{t.form.name}</Label>
                    <Input
                      id="nominee2_name"
                      name="nominee2_name"
                      className="rounded-xl"
                      placeholder={t.form.nomineePlaceholder}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nominee2_gender">{t.form.gender}</Label>
                    <Select name="nominee2_gender">
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder={t.form.selectGender} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">{t.form.male}</SelectItem>
                        <SelectItem value="female">{t.form.female}</SelectItem>
                        <SelectItem value="other">{t.form.other}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nominee2_age">{t.form.age}</Label>
                    <Input
                      id="nominee2_age"
                      name="nominee2_age"
                      type="number"
                      className="rounded-xl"
                      placeholder={t.form.agePlaceholder}
                      min={1}
                      max={120}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nominee2_relation">{t.form.relation}</Label>
                    <Input
                      id="nominee2_relation"
                      name="nominee2_relation"
                      className="rounded-xl"
                      placeholder={t.form.relationPlaceholder}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Director Authorization Notice */}
            <div className="text-center p-6 bg-secondary/5 rounded-xl border border-secondary/20">
              <img src={officialSeal} alt="Official Seal" className="w-24 h-24 mx-auto mb-3 object-contain" />
              <p className="text-sm font-medium text-secondary">
                {t.form.directorAuth}
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              className="w-full rounded-xl text-lg py-6 shadow-glow"
              disabled={isSubmitting}
            >
              {isSubmitting ? t.form.submitting : t.form.submit}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
};

export default ApplicationPage;
