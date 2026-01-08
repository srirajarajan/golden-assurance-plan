import React, { useRef, useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Camera, X, Send, Loader2, User, Phone, MapPin, Users, Shield, Briefcase, CreditCard, IndianRupee, FileImage } from 'lucide-react';

const ApplicationPage: React.FC = () => {
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoBase64, setPhotoBase64] = useState<string>('');
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [pamphletBase64, setPamphletBase64] = useState<string>('');
  const [pamphletPreview, setPamphletPreview] = useState<string>('');
  const [aadhaarFrontBase64, setAadhaarFrontBase64] = useState<string>('');
  const [aadhaarFrontPreview, setAadhaarFrontPreview] = useState<string>('');
  const [aadhaarBackBase64, setAadhaarBackBase64] = useState<string>('');
  const [aadhaarBackPreview, setAadhaarBackPreview] = useState<string>('');
  const { toast } = useToast();
  const { language, setLanguage, t } = useLanguage();

  // Initialize EmailJS on mount
  useEffect(() => {
    emailjs.init('gq4UP7sZykMwY4aQc');
  }, []);

  // Generic image handler
  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setBase64: React.Dispatch<React.SetStateAction<string>>,
    setPreview: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: t.form.imageTooLarge,
        description: t.form.imageSizeLimit,
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

      // Build template parameters - all fields optional
      const templateParams = {
        to_email: 'williamcareyfuneral99@gmail.com',
        applicant_name: formData.get('applicant_name') || 'Not provided',
        guardian_name: formData.get('guardian_name') || 'Not provided',
        gender: formData.get('gender') || 'Not provided',
        occupation: formData.get('occupation') || 'Not provided',
        ration_card: formData.get('ration_card') || 'Not provided',
        annual_income: formData.get('annual_income') || 'Not provided',
        aadhaar: formData.get('aadhaar') || 'Not provided',
        phone: formData.get('phone') || 'Not provided',
        address: formData.get('address') || 'Not provided',
        nominee1_name: formData.get('nominee1_name') || 'Not provided',
        nominee1_gender: formData.get('nominee1_gender') || 'Not provided',
        nominee1_age: formData.get('nominee1_age') || 'Not provided',
        nominee1_relation: formData.get('nominee1_relation') || 'Not provided',
        nominee2_name: formData.get('nominee2_name') || 'Not provided',
        nominee2_gender: formData.get('nominee2_gender') || 'Not provided',
        nominee2_age: formData.get('nominee2_age') || 'Not provided',
        nominee2_relation: formData.get('nominee2_relation') || 'Not provided',
        message: formData.get('message') || 'No message',
        photo_url: photoBase64 ? photoBase64.substring(0, 500) + '...[truncated]' : 'No photo',
        pamphlet_photo: pamphletBase64 ? pamphletBase64.substring(0, 500) + '...[truncated]' : 'No pamphlet photo',
        aadhaar_front: aadhaarFrontBase64 ? aadhaarFrontBase64.substring(0, 500) + '...[truncated]' : 'No Aadhaar front',
        aadhaar_back: aadhaarBackBase64 ? aadhaarBackBase64.substring(0, 500) + '...[truncated]' : 'No Aadhaar back',
      };

      console.log('Sending email via EmailJS...');

      const response = await emailjs.send(
        'service_oayf2od',
        'template_g6mbhol',
        templateParams
      );

      console.log('EmailJS Response:', response);

      if (response.status === 200) {
        toast({
          title: t.form.successTitle,
          description: t.form.successMessage,
        });
        form.reset();
        setPhotoBase64('');
        setPhotoPreview('');
        setPamphletBase64('');
        setPamphletPreview('');
        setAadhaarFrontBase64('');
        setAadhaarFrontPreview('');
        setAadhaarBackBase64('');
        setAadhaarBackPreview('');
      } else {
        throw new Error('Email failed');
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: t.form.errorTitle,
        description: t.form.errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Image upload component
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
    <div className="flex flex-col items-center gap-4 p-4 border-2 border-dashed rounded-lg bg-muted/20">
      <Label className="text-lg font-semibold flex items-center gap-2">
        <Icon className="w-5 h-5" />
        {label}
      </Label>
      {preview ? (
        <div className="relative">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-32 h-32 object-cover rounded-lg border-2 shadow-md"
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
        <label className="cursor-pointer flex flex-col items-center gap-2 p-6 border rounded-lg hover:bg-muted/50 transition-colors">
          <Icon className="w-10 h-10 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{t.form.uploadImage}</span>
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
                  onClick={() => setLanguage('en')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    language === 'en' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('ta')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    language === 'ta' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted'
                  }`}
                >
                  தமிழ்
                </button>
              </div>
            </div>
            
            <CardTitle className="text-2xl md:text-3xl font-bold text-primary">
              {t.form.title}
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              {t.form.subtitle}
            </p>
          </CardHeader>
          
          <CardContent className="p-6">
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
              
              {/* Photo Upload */}
              <ImageUpload
                label={t.form.photo}
                preview={photoPreview}
                onImageChange={(e) => handleImageChange(e, setPhotoBase64, setPhotoPreview)}
                onRemove={() => removeImage(setPhotoBase64, setPhotoPreview)}
                icon={Camera}
              />

              {/* Pamphlet Photo Upload */}
              <ImageUpload
                label={t.form.pamphletPhoto}
                preview={pamphletPreview}
                onImageChange={(e) => handleImageChange(e, setPamphletBase64, setPamphletPreview)}
                onRemove={() => removeImage(setPamphletBase64, setPamphletPreview)}
                icon={FileImage}
              />

              {/* Applicant Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  {t.form.applicantDetails}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="applicant_name">{t.form.memberName}</Label>
                    <Input id="applicant_name" name="applicant_name" placeholder={t.form.memberNamePlaceholder} className="mt-1" />
                  </div>
                  
                  <div>
                    <Label htmlFor="guardian_name">{t.form.fatherHusbandName}</Label>
                    <Input id="guardian_name" name="guardian_name" placeholder={t.form.fatherHusbandPlaceholder} className="mt-1" />
                  </div>
                  
                  <div>
                    <Label htmlFor="gender">{t.form.gender}</Label>
                    <select id="gender" name="gender" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                      <option value="">{t.form.selectGender}</option>
                      <option value={t.form.male}>{t.form.male}</option>
                      <option value={t.form.female}>{t.form.female}</option>
                      <option value={t.form.other}>{t.form.other}</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="occupation" className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      {t.form.occupation}
                    </Label>
                    <Input id="occupation" name="occupation" placeholder={t.form.occupationPlaceholder} className="mt-1" />
                  </div>
                  
                  <div>
                    <Label htmlFor="ration_card" className="flex items-center gap-1">
                      <CreditCard className="w-4 h-4" />
                      {t.form.rationCard}
                    </Label>
                    <Input id="ration_card" name="ration_card" placeholder={t.form.rationCardPlaceholder} className="mt-1" />
                  </div>
                  
                  <div>
                    <Label htmlFor="annual_income" className="flex items-center gap-1">
                      <IndianRupee className="w-4 h-4" />
                      {t.form.annualIncome}
                    </Label>
                    <Input id="annual_income" name="annual_income" placeholder="₹" className="mt-1" />
                  </div>
                  
                  <div>
                    <Label htmlFor="aadhaar" className="flex items-center gap-1">
                      <Shield className="w-4 h-4" />
                      {t.form.aadharCard}
                    </Label>
                    <Input id="aadhaar" name="aadhaar" placeholder={t.form.aadharPlaceholder} className="mt-1" />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {t.form.phone}
                    </Label>
                    <Input id="phone" name="phone" type="tel" placeholder={t.form.phonePlaceholder} className="mt-1" />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="address" className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {t.form.permanentAddress}
                  </Label>
                  <Textarea id="address" name="address" placeholder={t.form.addressPlaceholder} className="mt-1" rows={3} />
                </div>

                {/* Aadhaar Photo Uploads */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ImageUpload
                    label={t.form.aadharFront}
                    preview={aadhaarFrontPreview}
                    onImageChange={(e) => handleImageChange(e, setAadhaarFrontBase64, setAadhaarFrontPreview)}
                    onRemove={() => removeImage(setAadhaarFrontBase64, setAadhaarFrontPreview)}
                    icon={Shield}
                  />
                  <ImageUpload
                    label={t.form.aadharBack}
                    preview={aadhaarBackPreview}
                    onImageChange={(e) => handleImageChange(e, setAadhaarBackBase64, setAadhaarBackPreview)}
                    onRemove={() => removeImage(setAadhaarBackBase64, setAadhaarBackPreview)}
                    icon={Shield}
                  />
                </div>
              </div>

              {/* Nominee 1 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  {t.form.nominee1Title}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nominee1_name">{t.form.name}</Label>
                    <Input id="nominee1_name" name="nominee1_name" placeholder={t.form.nomineePlaceholder} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="nominee1_gender">{t.form.gender}</Label>
                    <select id="nominee1_gender" name="nominee1_gender" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                      <option value="">{t.form.selectGender}</option>
                      <option value={t.form.male}>{t.form.male}</option>
                      <option value={t.form.female}>{t.form.female}</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="nominee1_age">{t.form.age}</Label>
                    <Input id="nominee1_age" name="nominee1_age" type="number" placeholder={t.form.agePlaceholder} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="nominee1_relation">{t.form.relation}</Label>
                    <Input id="nominee1_relation" name="nominee1_relation" placeholder={t.form.relationPlaceholder} className="mt-1" />
                  </div>
                </div>
              </div>

              {/* Nominee 2 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  {t.form.nominee2Title}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nominee2_name">{t.form.name}</Label>
                    <Input id="nominee2_name" name="nominee2_name" placeholder={t.form.nomineePlaceholder} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="nominee2_gender">{t.form.gender}</Label>
                    <select id="nominee2_gender" name="nominee2_gender" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                      <option value="">{t.form.selectGender}</option>
                      <option value={t.form.male}>{t.form.male}</option>
                      <option value={t.form.female}>{t.form.female}</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="nominee2_age">{t.form.age}</Label>
                    <Input id="nominee2_age" name="nominee2_age" type="number" placeholder={t.form.agePlaceholder} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="nominee2_relation">{t.form.relation}</Label>
                    <Input id="nominee2_relation" name="nominee2_relation" placeholder={t.form.relationPlaceholder} className="mt-1" />
                  </div>
                </div>
              </div>

              {/* Message */}
              <div>
                <Label htmlFor="message">{t.form.message}</Label>
                <Textarea id="message" name="message" placeholder={t.form.messagePlaceholder} className="mt-1" rows={3} />
              </div>

              {/* Submit */}
              <Button type="submit" disabled={isSubmitting} className="w-full h-12 text-lg font-semibold">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {t.form.submitting}
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    {t.form.submit}
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                {t.form.secureSubmit}
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ApplicationPage;