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

const ApplicationPage = () => {
  const { language } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    
    // Append director authorization
    formData.append('director_authorization', 'Authorized by Director – William Carey Funeral Insurance');

    try {
      const response = await fetch('https://formspree.io/f/xvzgaooo', {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        setIsSuccess(true);
        toast({
          title: language === 'ta' ? 'நன்றி!' : 'Thank you!',
          description:
            language === 'ta'
              ? 'உங்கள் விண்ணப்பம் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது.'
              : 'Your application has been submitted successfully.',
        });
        form.reset();
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: language === 'ta' ? 'பிழை!' : 'Error',
        description:
          language === 'ta'
            ? 'விண்ணப்பத்தை சமர்ப்பிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.'
            : 'Failed to submit application. Please try again.',
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
              {language === 'ta' ? 'நன்றி!' : 'Thank you!'}
            </h2>
            <p className="text-muted-foreground text-lg">
              {language === 'ta'
                ? 'உங்கள் விண்ணப்பம் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது.'
                : 'Your application has been submitted successfully.'}
            </p>
            <Button
              onClick={() => setIsSuccess(false)}
              className="mt-6"
            >
              {language === 'ta' ? 'புதிய விண்ணப்பம்' : 'Submit Another Application'}
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
              உறுப்பினர் விண்ணப்பப் படிவம் / Membership Application Form
            </p>
            <div className="w-24 h-1 bg-primary mx-auto rounded-full mt-4" />
          </div>

          <form
            ref={formRef}
            onSubmit={handleSubmit}
            method="POST"
            className="card-elevated p-6 md:p-10 gold-border animate-slide-up space-y-8"
          >
            {/* Applicant Details Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <User className="text-primary" size={20} />
                <h2 className="font-display text-xl font-semibold text-secondary">
                  விண்ணப்பதாரர் விவரங்கள் / Applicant Details
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Applicant Name */}
                <div className="space-y-2">
                  <Label htmlFor="applicant_name">
                    உறுப்பினர் பெயர் / Applicant Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="applicant_name"
                    name="applicant_name"
                    required
                    className="rounded-xl"
                    placeholder="பெயர் / Name"
                  />
                </div>

                {/* Guardian Name */}
                <div className="space-y-2">
                  <Label htmlFor="guardian_name">
                    தகப்பனார் / கணவர் பெயர் / Father / Husband Name
                  </Label>
                  <Input
                    id="guardian_name"
                    name="guardian_name"
                    className="rounded-xl"
                    placeholder="தகப்பனார் / கணவர் பெயர்"
                  />
                </div>

                {/* Gender */}
                <div className="space-y-2">
                  <Label htmlFor="gender">
                    பாலினம் / Gender
                  </Label>
                  <Select name="gender">
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="பாலினம் தேர்வு செய்க / Select Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">ஆண் / Male</SelectItem>
                      <SelectItem value="female">பெண் / Female</SelectItem>
                      <SelectItem value="other">மற்றவை / Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Occupation */}
                <div className="space-y-2">
                  <Label htmlFor="occupation" className="flex items-center gap-2">
                    <Briefcase size={14} className="text-primary" />
                    தொழில் / Occupation
                  </Label>
                  <Input
                    id="occupation"
                    name="occupation"
                    className="rounded-xl"
                    placeholder="தொழில் / Occupation"
                  />
                </div>

                {/* Ration Card Number */}
                <div className="space-y-2">
                  <Label htmlFor="ration_card" className="flex items-center gap-2">
                    <CreditCard size={14} className="text-primary" />
                    குடும்ப அட்டை எண் / Ration Card No. <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="ration_card"
                    name="ration_card"
                    required
                    className="rounded-xl"
                    placeholder="குடும்ப அட்டை எண்"
                  />
                </div>

                {/* Annual Income Dropdown */}
                <div className="space-y-2">
                  <Label htmlFor="annual_income" className="flex items-center gap-2">
                    <IndianRupee size={14} className="text-primary" />
                    ஆண்டு வருமானம் / Annual Income <span className="text-destructive">*</span>
                  </Label>
                  <Select name="annual_income" required>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="வருமானம் தேர்வு செய்க / Select Income" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="below_175000">₹1.75 லட்சத்திற்கு கீழ் / Below ₹1.75 Lakhs</SelectItem>
                      <SelectItem value="above_175000">₹1.75 லட்சத்திற்கு மேல் / Above ₹1.75 Lakhs</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">அதிகபட்சம் ₹1.75 லட்சம் / Max – 1.75 Lakhs</p>
                </div>

                {/* Aadhaar Number */}
                <div className="space-y-2">
                  <Label htmlFor="aadhaar" className="flex items-center gap-2">
                    <Shield size={14} className="text-primary" />
                    ஆதார் அட்டை எண் / Aadhaar No.
                  </Label>
                  <Input
                    id="aadhaar"
                    name="aadhaar"
                    className="rounded-xl"
                    placeholder="XXXX XXXX XXXX"
                    maxLength={14}
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone size={14} className="text-primary" />
                    செல் / Mobile Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    className="rounded-xl"
                    placeholder="கைபேசி எண் / Mobile Number"
                  />
                </div>
              </div>

              {/* Address - Full Width */}
              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin size={14} className="text-primary" />
                  நிரந்தர முகவரி / Permanent Address
                </Label>
                <Textarea
                  id="address"
                  name="address"
                  className="rounded-xl min-h-[80px]"
                  placeholder="முழு முகவரி / Full Address"
                />
              </div>
            </div>

            {/* Nominee Details Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Users className="text-primary" size={20} />
                <h2 className="font-display text-xl font-semibold text-secondary">
                  வாரிசு விவரங்கள் / Nominee Details
                </h2>
              </div>

              {/* Nominee 1 */}
              <div className="space-y-4 p-4 bg-muted/50 rounded-xl">
                <h3 className="font-medium text-secondary">வாரிசு 1 / Nominee 1</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nominee1_name">பெயர் / Name</Label>
                    <Input
                      id="nominee1_name"
                      name="nominee1_name"
                      className="rounded-xl"
                      placeholder="வாரிசு பெயர் / Nominee Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nominee1_gender">பாலினம் / Gender</Label>
                    <Select name="nominee1_gender">
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="தேர்வு / Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">ஆண் / Male</SelectItem>
                        <SelectItem value="female">பெண் / Female</SelectItem>
                        <SelectItem value="other">மற்றவை / Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nominee1_age">வயது / Age</Label>
                    <Input
                      id="nominee1_age"
                      name="nominee1_age"
                      type="number"
                      className="rounded-xl"
                      placeholder="வயது / Age"
                      min={1}
                      max={120}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nominee1_relation">உறவு முறை / Relationship</Label>
                    <Input
                      id="nominee1_relation"
                      name="nominee1_relation"
                      className="rounded-xl"
                      placeholder="உறவு / Relationship"
                    />
                  </div>
                </div>
              </div>

              {/* Nominee 2 */}
              <div className="space-y-4 p-4 bg-muted/30 rounded-xl">
                <h3 className="font-medium text-muted-foreground">வாரிசு 2 / Nominee 2 (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nominee2_name">பெயர் / Name</Label>
                    <Input
                      id="nominee2_name"
                      name="nominee2_name"
                      className="rounded-xl"
                      placeholder="வாரிசு பெயர் / Nominee Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nominee2_gender">பாலினம் / Gender</Label>
                    <Select name="nominee2_gender">
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="தேர்வு / Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">ஆண் / Male</SelectItem>
                        <SelectItem value="female">பெண் / Female</SelectItem>
                        <SelectItem value="other">மற்றவை / Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nominee2_age">வயது / Age</Label>
                    <Input
                      id="nominee2_age"
                      name="nominee2_age"
                      type="number"
                      className="rounded-xl"
                      placeholder="வயது / Age"
                      min={1}
                      max={120}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nominee2_relation">உறவு முறை / Relationship</Label>
                    <Input
                      id="nominee2_relation"
                      name="nominee2_relation"
                      className="rounded-xl"
                      placeholder="உறவு / Relationship"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Director Authorization Notice */}
            <div className="text-center p-6 bg-secondary/5 rounded-xl border border-secondary/20">
              <img src={logo} alt="Official Seal" className="w-16 h-16 mx-auto mb-3 object-contain opacity-80" />
              <p className="text-sm font-medium text-secondary">
                Authorized by Director – William Carey Funeral Insurance
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                இயக்குநரால் அங்கீகரிக்கப்பட்டது
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              className="w-full rounded-xl text-lg py-6 shadow-glow"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? language === 'ta'
                  ? 'சமர்ப்பிக்கிறது...'
                  : 'Submitting...'
                : language === 'ta'
                  ? 'விண்ணப்பத்தை சமர்ப்பிக்கவும்'
                  : 'Submit Application'}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
};

export default ApplicationPage;
