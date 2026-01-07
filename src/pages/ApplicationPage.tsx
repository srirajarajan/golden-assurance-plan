import React, { useRef, useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Camera, X, Send, Loader2, User, Phone, MapPin, Users, Shield, Briefcase, CreditCard, IndianRupee } from 'lucide-react';

const ApplicationPage: React.FC = () => {
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoBase64, setPhotoBase64] = useState<string>('');
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const { toast } = useToast();

  // Initialize EmailJS on mount
  useEffect(() => {
    emailjs.init('gq4UP7sZykMwY4aQc');
  }, []);

  // Convert image to base64
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "படம் மிகப் பெரியது",
        description: "2MB க்கு குறைவான படத்தை பயன்படுத்தவும்",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPhotoBase64(base64String);
      setPhotoPreview(base64String);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoBase64('');
    setPhotoPreview('');
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
          title: "✅ வெற்றி!",
          description: "உங்கள் விண்ணப்பம் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது.",
        });
        form.reset();
        setPhotoBase64('');
        setPhotoPreview('');
      } else {
        throw new Error('Email failed');
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "❌ பிழை",
        description: "மின்னஞ்சல் அனுப்புவதில் பிழை ஏற்பட்டுள்ளது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl border-2">
          <CardHeader className="text-center bg-primary/5 border-b">
            <CardTitle className="text-2xl md:text-3xl font-bold text-primary">
              இறுதிச்சடங்கு காப்பீடு விண்ணப்பம்
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Funeral Insurance Application Form
            </p>
          </CardHeader>
          
          <CardContent className="p-6">
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
              
              {/* Photo Upload */}
              <div className="flex flex-col items-center gap-4 p-4 border-2 border-dashed rounded-lg bg-muted/20">
                <Label className="text-lg font-semibold flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  புகைப்படம் / Photo
                </Label>
                {photoPreview ? (
                  <div className="relative">
                    <img 
                      src={photoPreview} 
                      alt="Preview" 
                      className="w-32 h-32 object-cover rounded-lg border-2 shadow-md"
                    />
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-2 p-6 border rounded-lg hover:bg-muted/50 transition-colors">
                    <Camera className="w-10 h-10 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">படத்தை பதிவேற்றவும்</span>
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  </label>
                )}
              </div>

              {/* Applicant Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  விண்ணப்பதாரரின் விவரங்கள்
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="applicant_name">பெயர் / Name</Label>
                    <Input id="applicant_name" name="applicant_name" placeholder="முழு பெயர்" className="mt-1" />
                  </div>
                  
                  <div>
                    <Label htmlFor="guardian_name">தந்தை/கணவர் பெயர்</Label>
                    <Input id="guardian_name" name="guardian_name" placeholder="பாதுகாவலர் பெயர்" className="mt-1" />
                  </div>
                  
                  <div>
                    <Label htmlFor="gender">பாலினம் / Gender</Label>
                    <select id="gender" name="gender" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                      <option value="">தேர்ந்தெடுக்கவும்</option>
                      <option value="ஆண் / Male">ஆண் / Male</option>
                      <option value="பெண் / Female">பெண் / Female</option>
                      <option value="மற்றவை / Other">மற்றவை / Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="occupation" className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      தொழில் / Occupation
                    </Label>
                    <Input id="occupation" name="occupation" placeholder="தொழில்" className="mt-1" />
                  </div>
                  
                  <div>
                    <Label htmlFor="ration_card" className="flex items-center gap-1">
                      <CreditCard className="w-4 h-4" />
                      ரேஷன் கார்டு எண்
                    </Label>
                    <Input id="ration_card" name="ration_card" placeholder="ரேஷன் கார்டு எண்" className="mt-1" />
                  </div>
                  
                  <div>
                    <Label htmlFor="annual_income" className="flex items-center gap-1">
                      <IndianRupee className="w-4 h-4" />
                      ஆண்டு வருமானம்
                    </Label>
                    <Input id="annual_income" name="annual_income" placeholder="₹" className="mt-1" />
                  </div>
                  
                  <div>
                    <Label htmlFor="aadhaar" className="flex items-center gap-1">
                      <Shield className="w-4 h-4" />
                      ஆதார் எண்
                    </Label>
                    <Input id="aadhaar" name="aadhaar" placeholder="XXXX XXXX XXXX" className="mt-1" />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      தொலைபேசி / Phone
                    </Label>
                    <Input id="phone" name="phone" type="tel" placeholder="+91" className="mt-1" />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="address" className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    முகவரி / Address
                  </Label>
                  <Textarea id="address" name="address" placeholder="முழு முகவரி" className="mt-1" rows={3} />
                </div>
              </div>

              {/* Nominee 1 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  வாரிசு 1 / Nominee 1
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nominee1_name">பெயர் / Name</Label>
                    <Input id="nominee1_name" name="nominee1_name" placeholder="வாரிசு பெயர்" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="nominee1_gender">பாலினம் / Gender</Label>
                    <select id="nominee1_gender" name="nominee1_gender" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                      <option value="">தேர்ந்தெடுக்கவும்</option>
                      <option value="ஆண் / Male">ஆண் / Male</option>
                      <option value="பெண் / Female">பெண் / Female</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="nominee1_age">வயது / Age</Label>
                    <Input id="nominee1_age" name="nominee1_age" type="number" placeholder="வயது" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="nominee1_relation">உறவுமுறை / Relation</Label>
                    <Input id="nominee1_relation" name="nominee1_relation" placeholder="உறவுமுறை" className="mt-1" />
                  </div>
                </div>
              </div>

              {/* Nominee 2 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  வாரிசு 2 / Nominee 2
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nominee2_name">பெயர் / Name</Label>
                    <Input id="nominee2_name" name="nominee2_name" placeholder="வாரிசு பெயர்" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="nominee2_gender">பாலினம் / Gender</Label>
                    <select id="nominee2_gender" name="nominee2_gender" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                      <option value="">தேர்ந்தெடுக்கவும்</option>
                      <option value="ஆண் / Male">ஆண் / Male</option>
                      <option value="பெண் / Female">பெண் / Female</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="nominee2_age">வயது / Age</Label>
                    <Input id="nominee2_age" name="nominee2_age" type="number" placeholder="வயது" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="nominee2_relation">உறவுமுறை / Relation</Label>
                    <Input id="nominee2_relation" name="nominee2_relation" placeholder="உறவுமுறை" className="mt-1" />
                  </div>
                </div>
              </div>

              {/* Message */}
              <div>
                <Label htmlFor="message">கூடுதல் செய்தி / Message</Label>
                <Textarea id="message" name="message" placeholder="ஏதேனும் கூடுதல் தகவல்..." className="mt-1" rows={3} />
              </div>

              {/* Submit */}
              <Button type="submit" disabled={isSubmitting} className="w-full h-12 text-lg font-semibold">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    சமர்ப்பிக்கிறது...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    விண்ணப்பத்தை சமர்ப்பிக்கவும்
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                உங்கள் தகவல்கள் பாதுகாப்பாக அனுப்பப்படும்
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ApplicationPage;
