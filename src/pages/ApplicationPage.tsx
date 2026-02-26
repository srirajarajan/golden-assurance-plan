import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { uploadImageToPrivateStorage, compressImageFile } from '@/lib/uploadToPrivateStorage';
import { supabase } from '@/integrations/supabase/client';
import { Camera, X, Send, Loader2, User, Phone, MapPin, Users, Shield, Briefcase, CreditCard, IndianRupee, Image, Lock } from 'lucide-react';

type Language = 'en' | 'ta';

const formTranslations = {
  en: {
    title: "Funeral Insurance Application",
    subtitle: "Application Form",
    languageLabel: "Language",
    applicantPhoto: "Applicant Photo",
    aadhaarFront: "Aadhaar Front Side Photo",
    aadhaarBack: "Aadhaar Back Side Photo",
    pamphletImage: "Pamphlet Image Upload",
    uploadImage: "Tap to Upload / Capture",
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
    aadhaarImages: "Aadhaar Card Images",
    nominee1Title: "Nominee 1 (Required)",
    nomineeName: "Nominee Name",
    nomineeNamePlaceholder: "Enter nominee name",
    nomineeAge: "Age",
    nomineeAgePlaceholder: "Age",
    nomineeRelation: "Relationship",
    selectRelation: "Select Relationship",
    son: "Son",
    daughter: "Daughter",
    wife: "Wife",
    husband: "Husband",
    spouse: "Spouse",
    nominee2Title: "Nominee 2 (Optional)",
    additionalMessage: "Additional Message (Optional)",
    messagePlaceholder: "Any additional information...",
    submit: "Submit Application",
    submitting: "Submitting...",
    successTitle: "Thank you!",
    successMessage: "Your application has been submitted successfully.",
    errorTitle: "Error",
    errorMessage: "Failed to submit. Please try again.",
    imageTooLarge: "Image too large",
    imageSizeLimit: "Please use an image less than 5MB",
    uploadingImages: "Uploading images...",
    generatingPDF: "Generating PDF...",
    sendingEmail: "Sending notification...",
    loginRequired: "Login Required",
    loginRequiredMessage: "Please login to submit an application",
    pendingApproval: "Account Pending",
    pendingApprovalMessage: "Your account is pending admin approval. Please wait for approval to submit applications.",
    goToLogin: "Go to Login",
  },
  ta: {
    title: "இறுதிச்சடங்கு காப்பீடு விண்ணப்பம்",
    subtitle: "உறுப்பினர் விண்ணப்பப் படிவம்",
    languageLabel: "மொழி",
    applicantPhoto: "விண்ணப்பதாரர் புகைப்படம்",
    aadhaarFront: "ஆதார் முன்பக்க புகைப்படம்",
    aadhaarBack: "ஆதார் பின்பக்க புகைப்படம்",
    pamphletImage: "துண்டுப்பிரசுர புகைப்படம்",
    uploadImage: "பதிவேற்ற தட்டவும்",
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
    aadhaarImages: "ஆதார் அட்டை புகைப்படங்கள்",
    nominee1Title: "வாரிசு 1 (கட்டாயம்)",
    nomineeName: "வாரிசு பெயர்",
    nomineeNamePlaceholder: "வாரிசு பெயரை உள்ளிடவும்",
    nomineeAge: "வயது",
    nomineeAgePlaceholder: "வயது",
    nomineeRelation: "உறவு முறை",
    selectRelation: "உறவு முறையை தேர்வு செய்க",
    son: "மகன்",
    daughter: "மகள்",
    wife: "மனைவி",
    husband: "கணவர்",
    spouse: "துணைவர்",
    nominee2Title: "வாரிசு 2 (விருப்பத்திற்குட்பட்டது)",
    additionalMessage: "கூடுதல் செய்தி (விருப்பமானது)",
    messagePlaceholder: "ஏதேனும் கூடுதல் தகவல்...",
    submit: "விண்ணப்பத்தை சமர்ப்பிக்க",
    submitting: "சமர்ப்பிக்கிறது...",
    successTitle: "நன்றி!",
    successMessage: "உங்கள் விண்ணப்பம் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது.",
    errorTitle: "பிழை!",
    errorMessage: "சமர்ப்பிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
    imageTooLarge: "படம் மிகப் பெரியது",
    imageSizeLimit: "5MB க்கு குறைவான படத்தை பயன்படுத்தவும்",
    uploadingImages: "படங்களை பதிவேற்றுகிறது...",
    generatingPDF: "PDF உருவாக்குகிறது...",
    sendingEmail: "அறிவிப்பை அனுப்புகிறது...",
    loginRequired: "உள்நுழைவு தேவை",
    loginRequiredMessage: "விண்ணப்பத்தை சமர்ப்பிக்க உள்நுழையவும்",
    pendingApproval: "கணக்கு நிலுவையில்",
    pendingApprovalMessage: "உங்கள் கணக்கு நிர்வாகி அனுமதிக்காக காத்திருக்கிறது. விண்ணப்பங்களை சமர்ப்பிக்க அனுமதிக்காக காத்திருக்கவும்.",
    goToLogin: "உள்நுழைய செல்க",
  }
};

interface ImageState {
  file: File | null;
  preview: string;
  path: string;
}

const ApplicationPage: React.FC = () => {
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);
  const { user, isLoading, userStatus, checkUserStatus } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('ta');
  
  const [applicantPhoto, setApplicantPhoto] = useState<ImageState>({ file: null, preview: '', path: '' });
  const [aadhaarFront, setAadhaarFront] = useState<ImageState>({ file: null, preview: '', path: '' });
  const [aadhaarBack, setAadhaarBack] = useState<ImageState>({ file: null, preview: '', path: '' });
  const [pamphletImage, setPamphletImage] = useState<ImageState>({ file: null, preview: '', path: '' });
  
  const { toast } = useToast();
  const t = formTranslations[selectedLanguage];

  useEffect(() => {
    if (user) {
      checkUserStatus();
    }
  }, [user]);

  useEffect(() => {
    return () => {
      const previews = [applicantPhoto.preview, aadhaarFront.preview, aadhaarBack.preview, pamphletImage.preview];
      previews.forEach((p) => {
        if (p?.startsWith('blob:')) URL.revokeObjectURL(p);
      });
    };
  }, []);

  const handleImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setImageState: React.Dispatch<React.SetStateAction<ImageState>>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t.imageTooLarge,
        description: t.imageSizeLimit,
        variant: "destructive",
      });
      return;
    }

    try {
      const compressedFile = await compressImageFile(file, 1200, 0.8);
      const previewUrl = URL.createObjectURL(compressedFile);

      setImageState((prev) => {
        if (prev.preview?.startsWith('blob:')) {
          URL.revokeObjectURL(prev.preview);
        }
        return {
          file: compressedFile,
          preview: previewUrl,
          path: '',
        };
      });

      e.target.value = '';
    } catch (error) {
      console.error('Image processing error:', error);
      toast({
        title: t.errorTitle,
        description: 'Failed to process image',
        variant: "destructive",
      });
    }
  };

  const removeImage = (setImageState: React.Dispatch<React.SetStateAction<ImageState>>) => {
    setImageState((prev) => {
      if (prev.preview?.startsWith('blob:')) {
        URL.revokeObjectURL(prev.preview);
      }
      return { file: null, preview: '', path: '' };
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!user) {
      toast({
        title: t.loginRequired,
        description: t.loginRequiredMessage,
        variant: "destructive",
      });
      return;
    }

    if (userStatus !== 'active') {
      toast({
        title: t.pendingApproval,
        description: t.pendingApprovalMessage,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const form = formRef.current;
      if (!form) throw new Error('Form not found');

      const userId = user.id;
      const formData = new FormData(form);

      if (!applicantPhoto.file || !aadhaarFront.file || !aadhaarBack.file || !pamphletImage.file) {
        throw new Error('Please upload all required images');
      }

      setSubmitStep(t.uploadingImages);

      const applicantPhotoPath = await uploadImageToPrivateStorage(applicantPhoto.file, 'applicant_photo', userId);
      if (!applicantPhotoPath) throw new Error('Failed to upload applicant photo');

      const aadhaarFrontPath = await uploadImageToPrivateStorage(aadhaarFront.file, 'aadhaar_front', userId);
      if (!aadhaarFrontPath) throw new Error('Failed to upload Aadhaar front');

      const aadhaarBackPath = await uploadImageToPrivateStorage(aadhaarBack.file, 'aadhaar_back', userId);
      if (!aadhaarBackPath) throw new Error('Failed to upload Aadhaar back');

      const pamphletImagePath = await uploadImageToPrivateStorage(pamphletImage.file, 'pamphlet_image', userId);
      if (!pamphletImagePath) throw new Error('Failed to upload pamphlet image');

      setSubmitStep(t.submitting);

      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;
      const supabaseUrl = (supabase as any).supabaseUrl as string;
      const supabaseKey = (supabase as any).supabaseKey as string;

      const payload = {
        member_name: (formData.get('member_name') as string)?.trim() || '',
        guardian_name: (formData.get('guardian_name') as string)?.trim() || '',
        gender: (formData.get('gender') as string)?.trim() || '',
        occupation: (formData.get('occupation') as string)?.trim() || '',
        ration_card: (formData.get('ration_card') as string)?.trim() || '',
        annual_income: (formData.get('annual_income') as string)?.trim() || '',
        aadhaar_number: (formData.get('aadhaar_number') as string)?.trim() || '',
        mobile_number: (formData.get('mobile_number') as string)?.trim() || '',
        address: (formData.get('address') as string)?.trim() || '',
        nominee1_name: (formData.get('nominee1_name') as string)?.trim() || '',
        nominee1_gender: (formData.get('nominee1_gender') as string)?.trim() || '',
        nominee1_age: (formData.get('nominee1_age') as string)?.trim() || '',
        nominee1_relation: (formData.get('nominee1_relation') as string)?.trim() || '',
        nominee2_name: (formData.get('nominee2_name') as string)?.trim() || '',
        nominee2_gender: (formData.get('nominee2_gender') as string)?.trim() || '',
        nominee2_age: (formData.get('nominee2_age') as string)?.trim() || '',
        nominee2_relation: (formData.get('nominee2_relation') as string)?.trim() || '',
        additional_message: (formData.get('additional_message') as string)?.trim() || '',
        selected_language: selectedLanguage,
        applicant_photo_path: applicantPhotoPath,
        aadhaar_front_path: aadhaarFrontPath,
        aadhaar_back_path: aadhaarBackPath,
        pamphlet_image_path: pamphletImagePath,
        user_id: userId,
      };

      // Step 1: Generate PDF and send email (without serial number first)
      setSubmitStep(t.sendingEmail);

      const pdfRes = await fetch(`${supabaseUrl}/functions/v1/generate-application-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          ...(supabaseKey ? { apikey: supabaseKey } : {}),
        },
        body: JSON.stringify({
          ...payload,
          language: selectedLanguage,
          staff_email: user.email || '',
        }),
      });

      let emailSuccess = false;
      try {
        const pdfData = await pdfRes.json();
        if (pdfData.success) {
          emailSuccess = true;
        } else {
          console.error('Email send failed:', pdfData.error);
        }
      } catch {
        console.error('Failed to parse PDF/email response');
      }

      if (!emailSuccess) {
        toast({
          title: t.errorTitle,
          description: 'Application saved but email not sent.',
          variant: 'destructive',
        });
        return;
      }

      // Step 2: Only generate serial AFTER email succeeds
      const serialRes = await fetch(`${supabaseUrl}/functions/v1/generate-serial`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          ...(supabaseKey ? { apikey: supabaseKey } : {}),
        },
        body: JSON.stringify({ staff_user_id: userId }),
      });

      const serialData = await serialRes.json();
      if (!serialRes.ok || serialData.error) {
        throw new Error(serialData.error || 'Failed to generate serial number');
      }

      const serialNumber = serialData.serial_number;

      // Step 3: Record application in DB
      await supabase.from('applications').insert({
        serial_number: serialNumber,
        staff_user_id: userId,
        staff_email: user.email || '',
        member_name: payload.member_name,
        pdf_path: `${serialNumber}.pdf`,
      });

      toast({
        title: t.successTitle,
        description: `${t.successMessage} (Serial: ${serialNumber})`,
      });
      
      form.reset();
      removeImage(setApplicantPhoto);
      removeImage(setAadhaarFront);
      removeImage(setAadhaarBack);
      removeImage(setPamphletImage);
    } catch (error: any) {
      console.error('Submit Error:', error);
      toast({
        title: t.errorTitle,
        description: error?.message || t.errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setSubmitStep('');
    }
  };

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
            accept="image/*" 
            capture="environment"
            onChange={onImageChange} 
            className="hidden" 
          />
        </label>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md shadow-xl border-2">
          <CardContent className="p-8 text-center">
            <Lock className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-primary mb-2">{t.loginRequired}</h2>
            <p className="text-muted-foreground mb-6">{t.loginRequiredMessage}</p>
            <Button onClick={() => navigate('/login')} className="w-full">
              {t.goToLogin}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (userStatus === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md shadow-xl border-2">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-16 w-16 text-primary mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-primary mb-2">{t.pendingApproval}</h2>
            <p className="text-muted-foreground">{t.pendingApprovalMessage}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if ((userStatus as string) === 'rejected' || (userStatus as string) === 'terminated') {
    const isTerminated = (userStatus as string) === 'terminated';
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md shadow-xl border-2">
          <CardContent className="p-8 text-center">
            <X className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-destructive mb-2">
              {selectedLanguage === 'en' 
                ? (isTerminated ? 'Account Terminated' : 'Account Rejected')
                : (isTerminated ? 'கணக்கு நிறுத்தப்பட்டது' : 'கணக்கு நிராகரிக்கப்பட்டது')}
            </h2>
            <p className="text-muted-foreground">
              {selectedLanguage === 'en' 
                ? (isTerminated ? 'Your account has been terminated. Contact admin.' : 'Your account has been rejected. Please contact support.')
                : (isTerminated ? 'உங்கள் கணக்கு நிறுத்தப்பட்டது. நிர்வாகியை தொடர்பு கொள்ளவும்.' : 'உங்கள் கணக்கு நிராகரிக்கப்பட்டது. ஆதரவைத் தொடர்பு கொள்ளவும்.')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl border-2">
          <CardHeader className="text-center bg-primary/5 border-b">
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
              
              <ImageUpload
                label={t.applicantPhoto}
                preview={applicantPhoto.preview}
                onImageChange={(e) => handleImageChange(e, setApplicantPhoto)}
                onRemove={() => removeImage(setApplicantPhoto)}
                icon={Camera}
              />

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
                    <select 
                      id="gender" 
                      name="gender" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-ring"
                    >
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

              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  {t.aadhaarImages}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ImageUpload
                    label={t.aadhaarFront}
                    preview={aadhaarFront.preview}
                    onImageChange={(e) => handleImageChange(e, setAadhaarFront)}
                    onRemove={() => removeImage(setAadhaarFront)}
                    icon={Shield}
                  />
                  <ImageUpload
                    label={t.aadhaarBack}
                    preview={aadhaarBack.preview}
                    onImageChange={(e) => handleImageChange(e, setAadhaarBack)}
                    onRemove={() => removeImage(setAadhaarBack)}
                    icon={Shield}
                  />
                </div>
              </div>

              <ImageUpload
                label={t.pamphletImage}
                preview={pamphletImage.preview}
                onImageChange={(e) => handleImageChange(e, setPamphletImage)}
                onRemove={() => removeImage(setPamphletImage)}
                icon={Image}
              />

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
                    <select 
                      id="nominee1_gender" 
                      name="nominee1_gender" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-ring"
                    >
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
                    <select 
                      id="nominee1_relation" 
                      name="nominee1_relation" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">{t.selectRelation}</option>
                      <option value={t.son}>{t.son}</option>
                      <option value={t.daughter}>{t.daughter}</option>
                      <option value={t.wife}>{t.wife}</option>
                      <option value={t.husband}>{t.husband}</option>
                      <option value={t.spouse}>{t.spouse}</option>
                    </select>
                  </div>
                </div>
              </div>

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
                    <select 
                      id="nominee2_gender" 
                      name="nominee2_gender" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-ring"
                    >
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
                    <select 
                      id="nominee2_relation" 
                      name="nominee2_relation" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">{t.selectRelation}</option>
                      <option value={t.son}>{t.son}</option>
                      <option value={t.daughter}>{t.daughter}</option>
                      <option value={t.wife}>{t.wife}</option>
                      <option value={t.husband}>{t.husband}</option>
                      <option value={t.spouse}>{t.spouse}</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="additional_message">{t.additionalMessage}</Label>
                <Textarea 
                  id="additional_message" 
                  name="additional_message" 
                  placeholder={t.messagePlaceholder} 
                  rows={3} 
                />
              </div>

              <Button 
                type="submit" 
                className="w-full text-lg py-6"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {submitStep || t.submitting}
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
