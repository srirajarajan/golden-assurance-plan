import React, { useRef, useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Camera, X, Send, Loader2, User, Phone, MapPin, Users, Shield, Briefcase, CreditCard, IndianRupee } from 'lucide-react';

type Language = 'en' | 'ta';

// Complete translations for strict language separation
const formTranslations = {
  en: {
    title: "Funeral Insurance Application",
    subtitle: "Application Form",
    languageLabel: "Language",
    // Photo Labels
    applicantPhoto: "Applicant Photo",
    aadhaarFront: "Aadhaar Front Side Photo",
    aadhaarBack: "Aadhaar Back Side Photo",
    uploadImage: "Tap to Upload / Capture",
    // Applicant Details
    applicantDetails: "Applicant Details",
    memberName: "Member Name",
    memberNamePlaceholder: "Enter your name",
    guardianName: "Father / Husband Name",
    guardianNamePlaceholder: "Enter father/husband name",
    gender: "Gender",
    selectGender: "Select Gender",
    male: "Male",
    female: "Female",
    other: "Other",
    occupation: "Occupation",
    occupationPlaceholder: "Enter occupation",
    rationCard: "Ration Card Number",
    rationCardPlaceholder: "Enter ration card number",
    annualIncome: "Annual Income (Max ₹1.75 Lakhs)",
    annualIncomePlaceholder: "Enter annual income",
    aadhaarNumber: "Aadhaar Number (12 digits)",
    aadhaarPlaceholder: "XXXX XXXX XXXX",
    mobileNumber: "Mobile Number",
    mobilePlaceholder: "Enter mobile number",
    permanentAddress: "Permanent Address",
    addressPlaceholder: "Enter full address",
    // Nominee 1
    nominee1Title: "Nominee 1 (Required)",
    nomineeName: "Nominee Name",
    nomineeNamePlaceholder: "Enter nominee name",
    nomineeAge: "Age",
    nomineeAgePlaceholder: "Age",
    nomineeRelation: "Relationship",
    nomineeRelationPlaceholder: "Enter relationship",
    // Nominee 2
    nominee2Title: "Nominee 2 (Optional)",
    // Additional
    additionalMessage: "Additional Message (Optional)",
    messagePlaceholder: "Any additional information...",
    // Submit
    submit: "Submit Application",
    submitting: "Submitting...",
    successTitle: "Thank you!",
    successMessage: "Your application has been submitted successfully.",
    errorTitle: "Error",
    errorMessage: "Failed to submit. Please try again.",
    imageTooLarge: "Image too large",
    imageSizeLimit: "Please use an image less than 2MB"
  },
  ta: {
    title: "இறுதிச்சடங்கு காப்பீடு விண்ணப்பம்",
    subtitle: "உறுப்பினர் விண்ணப்பப் படிவம்",
    languageLabel: "மொழி",
    // Photo Labels
    applicantPhoto: "விண்ணப்பதாரர் புகைப்படம்",
    aadhaarFront: "ஆதார் முன்பக்க புகைப்படம்",
    aadhaarBack: "ஆதார் பின்பக்க புகைப்படம்",
    uploadImage: "பதிவேற்ற தட்டவும்",
    // Applicant Details
    applicantDetails: "விண்ணப்பதாரர் விவரங்கள்",
    memberName: "உறுப்பினர் பெயர்",
    memberNamePlaceholder: "பெயரை உள்ளிடவும்",
    guardianName: "தகப்பனார் / கணவர் பெயர்",
    guardianNamePlaceholder: "தகப்பனார் / கணவர் பெயரை உள்ளிடவும்",
    gender: "பாலினம்",
    selectGender: "பாலினம் தேர்வு செய்க",
    male: "ஆண்",
    female: "பெண்",
    other: "மற்றவை",
    occupation: "தொழில்",
    occupationPlaceholder: "தொழிலை உள்ளிடவும்",
    rationCard: "குடும்ப அட்டை எண்",
    rationCardPlaceholder: "குடும்ப அட்டை எண்ணை உள்ளிடவும்",
    annualIncome: "ஆண்டு வருமானம் (அதிகபட்சம் ₹1.75 லட்சம்)",
    annualIncomePlaceholder: "ஆண்டு வருமானத்தை உள்ளிடவும்",
    aadhaarNumber: "ஆதார் எண் (12 இலக்கங்கள்)",
    aadhaarPlaceholder: "XXXX XXXX XXXX",
    mobileNumber: "கைபேசி எண்",
    mobilePlaceholder: "கைபேசி எண்ணை உள்ளிடவும்",
    permanentAddress: "நிரந்தர முகவரி",
    addressPlaceholder: "முழு முகவரியை உள்ளிடவும்",
    // Nominee 1
    nominee1Title: "வாரிசு 1 (கட்டாயம்)",
    nomineeName: "வாரிசு பெயர்",
    nomineeNamePlaceholder: "வாரிசு பெயரை உள்ளிடவும்",
    nomineeAge: "வயது",
    nomineeAgePlaceholder: "வயது",
    nomineeRelation: "உறவு முறை",
    nomineeRelationPlaceholder: "உறவு முறையை உள்ளிடவும்",
    // Nominee 2
    nominee2Title: "வாரிசு 2 (விருப்பத்திற்குட்பட்டது)",
    // Additional
    additionalMessage: "கூடுதல் செய்தி (விருப்பமானது)",
    messagePlaceholder: "ஏதேனும் கூடுதல் தகவல்...",
    // Submit
    submit: "விண்ணப்பத்தை சமர்ப்பிக்க",
    submitting: "சமர்ப்பிக்கிறது...",
    successTitle: "நன்றி!",
    successMessage: "உங்கள் விண்ணப்பம் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது.",
    errorTitle: "பிழை!",
    errorMessage: "சமர்ப்பிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
    imageTooLarge: "படம் மிகப் பெரியது",
    imageSizeLimit: "2MB க்கு குறைவான படத்தை பயன்படுத்தவும்"
  }
};

const ApplicationPage: React.FC = () => {
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('ta');
  
  // Image states
  const [applicantPhoto, setApplicantPhoto] = useState<string>('');
  const [applicantPhotoPreview, setApplicantPhotoPreview] = useState<string>('');
  const [aadhaarFront, setAadhaarFront] = useState<string>('');
  const [aadhaarFrontPreview, setAadhaarFrontPreview] = useState<string>('');
  const [aadhaarBack, setAadhaarBack] = useState<string>('');
  const [aadhaarBackPreview, setAadhaarBackPreview] = useState<string>('');
  
  const { toast } = useToast();
  const t = formTranslations[selectedLanguage];

  // Initialize EmailJS
  useEffect(() => {
    emailjs.init('gq4UP7sZykMwY4aQc');
  }, []);

  // Image handler with Base64 conversion
  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setBase64: React.Dispatch<React.SetStateAction<string>>,
    setPreview: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: t.imageTooLarge,
        description: t.imageSizeLimit,
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setBase64(base64String);
      setPreview(base64String);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (
    setBase64: React.Dispatch<React.SetStateAction<string>>,
    setPreview: React.Dispatch<React.SetStateAction<string>>
  ) => {
    setBase64('');
    setPreview('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const form = formRef.current;
      if (!form) throw new Error('Form not found');

      const formData = new FormData(form);

      // EXACT template variables as specified
      const templateParams = {
        member_name: formData.get('member_name') || '—',
        guardian_name: formData.get('guardian_name') || '—',
        gender: formData.get('gender') || '—',
        occupation: formData.get('occupation') || '—',
        ration_card: formData.get('ration_card') || '—',
        annual_income: formData.get('annual_income') || '—',
        aadhaar_number: formData.get('aadhaar_number') || '—',
        mobile_number: formData.get('mobile_number') || '—',
        address: formData.get('address') || '—',
        nominee1_name: formData.get('nominee1_name') || '—',
        nominee1_gender: formData.get('nominee1_gender') || '—',
        nominee1_age: formData.get('nominee1_age') || '—',
        nominee1_relation: formData.get('nominee1_relation') || '—',
        nominee2_name: formData.get('nominee2_name') || '—',
        nominee2_gender: formData.get('nominee2_gender') || '—',
        nominee2_age: formData.get('nominee2_age') || '—',
        nominee2_relation: formData.get('nominee2_relation') || '—',
        additional_message: formData.get('additional_message') || '—',
        applicant_photo: applicantPhoto || '—',
        aadhaar_front: aadhaarFront || '—',
        aadhaar_back: aadhaarBack || '—',
        selected_language: selectedLanguage === 'en' ? 'English' : 'Tamil'
      };

      const response = await emailjs.send(
        'service_oayf2od',
        'template_g6mbhol',
        templateParams
      );

      if (response.status === 200) {
        toast({
          title: t.successTitle,
          description: t.successMessage,
        });
        form.reset();
        setApplicantPhoto('');
        setApplicantPhotoPreview('');
        setAadhaarFront('');
        setAadhaarFrontPreview('');
        setAadhaarBack('');
        setAadhaarBackPreview('');
      } else {
        throw new Error('Email failed');
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: t.errorTitle,
        description: t.errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Image Upload Component
  const ImageUpload = ({
    label,
    preview,
    onImageChange,
    onRemove,
    icon: Icon = Camera
  }: {
    label: string;
    preview: string;
    onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemove: () => void;
    icon?: React.ElementType;
  }) => (
    <div className="flex flex-col items-center gap-3 p-4 border-2 border-dashed rounded-lg bg-muted/20">
      <Label className="text-base font-semibold flex items-center gap-2">
        <Icon className="w-5 h-5" />
        {label}
      </Label>
      {preview ? (
        <div className="relative">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-28 h-28 object-cover rounded-lg border-2 shadow-md"
          />
          <button
            type="button"
            onClick={onRemove}
            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className="cursor-pointer flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
          <Icon className="w-8 h-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground text-center">{t.uploadImage}</span>
          <input 
            type="file" 
            accept="image/jpeg,image/jpg,image/png" 
            capture="environment"
            onChange={onImageChange} 
            className="hidden" 
          />
        </label>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl border-2">
          <CardHeader className="text-center bg-primary/5 border-b">
            {/* Language Selector */}
            <div className="flex justify-end mb-4">
              <div className="inline-flex rounded-lg border border-input bg-background p-1">
                <button
                  type="button"
                  onClick={() => setSelectedLanguage('ta')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    selectedLanguage === 'ta' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted'
                  }`}
                >
                  தமிழ்
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLanguage('en')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    selectedLanguage === 'en' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted'
                  }`}
                >
                  English
                </button>
              </div>
            </div>
            
            <CardTitle className="text-2xl md:text-3xl font-bold text-primary">
              {t.title}
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              {t.subtitle}
            </p>
          </CardHeader>
          
          <CardContent className="p-6">
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
              
              {/* Applicant Photos Section */}
              <div className="space-y-4">
                <ImageUpload
                  label={t.applicantPhoto}
                  preview={applicantPhotoPreview}
                  onImageChange={(e) => handleImageChange(e, setApplicantPhoto, setApplicantPhotoPreview)}
                  onRemove={() => removeImage(setApplicantPhoto, setApplicantPhotoPreview)}
                  icon={Camera}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ImageUpload
                    label={t.aadhaarFront}
                    preview={aadhaarFrontPreview}
                    onImageChange={(e) => handleImageChange(e, setAadhaarFront, setAadhaarFrontPreview)}
                    onRemove={() => removeImage(setAadhaarFront, setAadhaarFrontPreview)}
                    icon={Shield}
                  />
                  <ImageUpload
                    label={t.aadhaarBack}
                    preview={aadhaarBackPreview}
                    onImageChange={(e) => handleImageChange(e, setAadhaarBack, setAadhaarBackPreview)}
                    onRemove={() => removeImage(setAadhaarBack, setAadhaarBackPreview)}
                    icon={Shield}
                  />
                </div>
              </div>

              {/* Applicant Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  {t.applicantDetails}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="member_name">{t.memberName}</Label>
                    <Input id="member_name" name="member_name" placeholder={t.memberNamePlaceholder} className="mt-1" />
                  </div>
                  
                  <div>
                    <Label htmlFor="guardian_name">{t.guardianName}</Label>
                    <Input id="guardian_name" name="guardian_name" placeholder={t.guardianNamePlaceholder} className="mt-1" />
                  </div>
                  
                  <div>
                    <Label htmlFor="gender">{t.gender}</Label>
                    <select id="gender" name="gender" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                      <option value="">{t.selectGender}</option>
                      <option value={t.male}>{t.male}</option>
                      <option value={t.female}>{t.female}</option>
                      <option value={t.other}>{t.other}</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="occupation" className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      {t.occupation}
                    </Label>
                    <Input id="occupation" name="occupation" placeholder={t.occupationPlaceholder} className="mt-1" />
                  </div>
                  
                  <div>
                    <Label htmlFor="ration_card" className="flex items-center gap-1">
                      <CreditCard className="w-4 h-4" />
                      {t.rationCard}
                    </Label>
                    <Input id="ration_card" name="ration_card" placeholder={t.rationCardPlaceholder} className="mt-1" />
                  </div>
                  
                  <div>
                    <Label htmlFor="annual_income" className="flex items-center gap-1">
                      <IndianRupee className="w-4 h-4" />
                      {t.annualIncome}
                    </Label>
                    <Input id="annual_income" name="annual_income" placeholder={t.annualIncomePlaceholder} className="mt-1" />
                  </div>
                  
                  <div>
                    <Label htmlFor="aadhaar_number" className="flex items-center gap-1">
                      <Shield className="w-4 h-4" />
                      {t.aadhaarNumber}
                    </Label>
                    <Input id="aadhaar_number" name="aadhaar_number" placeholder={t.aadhaarPlaceholder} maxLength={14} className="mt-1" />
                  </div>
                  
                  <div>
                    <Label htmlFor="mobile_number" className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {t.mobileNumber}
                    </Label>
                    <Input id="mobile_number" name="mobile_number" type="tel" placeholder={t.mobilePlaceholder} className="mt-1" />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="address" className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {t.permanentAddress}
                  </Label>
                  <Textarea id="address" name="address" placeholder={t.addressPlaceholder} className="mt-1" rows={3} />
                </div>
              </div>

              {/* Nominee 1 - Required */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  {t.nominee1Title}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nominee1_name">{t.nomineeName}</Label>
                    <Input id="nominee1_name" name="nominee1_name" placeholder={t.nomineeNamePlaceholder} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="nominee1_gender">{t.gender}</Label>
                    <select id="nominee1_gender" name="nominee1_gender" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                      <option value="">{t.selectGender}</option>
                      <option value={t.male}>{t.male}</option>
                      <option value={t.female}>{t.female}</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="nominee1_age">{t.nomineeAge}</Label>
                    <Input id="nominee1_age" name="nominee1_age" type="number" placeholder={t.nomineeAgePlaceholder} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="nominee1_relation">{t.nomineeRelation}</Label>
                    <Input id="nominee1_relation" name="nominee1_relation" placeholder={t.nomineeRelationPlaceholder} className="mt-1" />
                  </div>
                </div>
              </div>

              {/* Nominee 2 - Optional */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  {t.nominee2Title}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nominee2_name">{t.nomineeName}</Label>
                    <Input id="nominee2_name" name="nominee2_name" placeholder={t.nomineeNamePlaceholder} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="nominee2_gender">{t.gender}</Label>
                    <select id="nominee2_gender" name="nominee2_gender" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                      <option value="">{t.selectGender}</option>
                      <option value={t.male}>{t.male}</option>
                      <option value={t.female}>{t.female}</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="nominee2_age">{t.nomineeAge}</Label>
                    <Input id="nominee2_age" name="nominee2_age" type="number" placeholder={t.nomineeAgePlaceholder} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="nominee2_relation">{t.nomineeRelation}</Label>
                    <Input id="nominee2_relation" name="nominee2_relation" placeholder={t.nomineeRelationPlaceholder} className="mt-1" />
                  </div>
                </div>
              </div>

              {/* Additional Message */}
              <div className="space-y-2">
                <Label htmlFor="additional_message">{t.additionalMessage}</Label>
                <Textarea 
                  id="additional_message" 
                  name="additional_message" 
                  placeholder={t.messagePlaceholder} 
                  rows={3} 
                />
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full text-lg py-6"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {t.submitting}
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    {t.submit}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ApplicationPage;
