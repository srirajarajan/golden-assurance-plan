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
import {
  Camera, X, Send, Loader2, User, Phone, MapPin, Users, Shield,
  Briefcase, CreditCard, IndianRupee, Lock, Star, Sparkles, Crown, Check,
} from 'lucide-react';
import { PLANS, type PlanId, getPlanById } from '@/data/plans';
import SmartAadhaarCapture from '@/components/SmartAadhaarCapture';

interface ImageState {
  file: File | null;
  preview: string;
  path: string;
}

const PLAN_ICONS = { silver: Star, gold: Sparkles, platinum: Crown } as const;

const ApplicationPage: React.FC = () => {
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);
  const { user, isLoading, userStatus, checkUserStatus } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState<string>('');

  const [applicantPhoto, setApplicantPhoto] = useState<ImageState>({ file: null, preview: '', path: '' });
  const [aadhaarFront, setAadhaarFront] = useState<ImageState>({ file: null, preview: '', path: '' });
  const [aadhaarBack, setAadhaarBack] = useState<ImageState>({ file: null, preview: '', path: '' });
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('silver');

  const { toast } = useToast();

  useEffect(() => { if (user) checkUserStatus(); }, [user]);

  useEffect(() => {
    return () => {
      [applicantPhoto.preview, aadhaarFront.preview, aadhaarBack.preview].forEach((p) => {
        if (p?.startsWith('blob:')) URL.revokeObjectURL(p);
      });
    };
  }, []);

  const handleFile = async (
    file: File,
    setter: React.Dispatch<React.SetStateAction<ImageState>>
  ) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Image too large', description: 'Please use an image less than 5MB', variant: 'destructive' });
      return;
    }
    try {
      const compressed = await compressImageFile(file, 1200, 0.85);
      const url = URL.createObjectURL(compressed);
      setter((prev) => {
        if (prev.preview?.startsWith('blob:')) URL.revokeObjectURL(prev.preview);
        return { file: compressed, preview: url, path: '' };
      });
    } catch (err) {
      console.error('Image processing error:', err);
      toast({ title: 'Error', description: 'Failed to process image', variant: 'destructive' });
    }
  };

  const handleFileInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<ImageState>>
  ) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file, setter);
    e.target.value = '';
  };

  const removeImage = (setter: React.Dispatch<React.SetStateAction<ImageState>>) => {
    setter((prev) => {
      if (prev.preview?.startsWith('blob:')) URL.revokeObjectURL(prev.preview);
      return { file: null, preview: '', path: '' };
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!user) {
      toast({ title: 'Login Required', description: 'Please login to submit an application', variant: 'destructive' });
      return;
    }
    if (userStatus !== 'active') {
      toast({ title: 'Account Pending', description: 'Your account is pending admin approval.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const form = formRef.current;
      if (!form) throw new Error('Form not found');
      const userId = user.id;
      const formData = new FormData(form);

      const mobileNumber = (formData.get('mobile_number') as string)?.replace(/\D/g, '') || '';
      if (mobileNumber.length !== 10) {
        toast({ title: 'Error', description: 'Enter valid 10-digit mobile number', variant: 'destructive' });
        setIsSubmitting(false);
        return;
      }
      if (!paymentMethod) {
        toast({ title: 'Error', description: 'Please select a payment method', variant: 'destructive' });
        setIsSubmitting(false);
        return;
      }
      if (!applicantPhoto.file || !aadhaarFront.file || !aadhaarBack.file) {
        throw new Error('Please upload Photo, Aadhaar Front and Aadhaar Back');
      }

      setSubmitStep('Uploading images...');
      const applicantPhotoPath = await uploadImageToPrivateStorage(applicantPhoto.file, 'applicant_photo', userId);
      if (!applicantPhotoPath) throw new Error('Failed to upload applicant photo');
      const aadhaarFrontPath = await uploadImageToPrivateStorage(aadhaarFront.file, 'aadhaar_front', userId);
      if (!aadhaarFrontPath) throw new Error('Failed to upload Aadhaar front');
      const aadhaarBackPath = await uploadImageToPrivateStorage(aadhaarBack.file, 'aadhaar_back', userId);
      if (!aadhaarBackPath) throw new Error('Failed to upload Aadhaar back');

      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;
      const supabaseUrl = (supabase as any).supabaseUrl as string;
      const supabaseKey = (supabase as any).supabaseKey as string;

      const plan = getPlanById(selectedPlan)!;

      const payload = {
        member_name: (formData.get('member_name') as string)?.trim() || '',
        age: (formData.get('age') as string)?.trim() || '',
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
        payment_method: paymentMethod,
        selected_language: 'en',
        applicant_photo_path: applicantPhotoPath,
        aadhaar_front_path: aadhaarFrontPath,
        aadhaar_back_path: aadhaarBackPath,
        selected_plan: plan.id,
        plan_code: plan.code,
        plan_name: plan.name,
        plan_amount: plan.amount,
        plan_worth: plan.worth,
        plan_activation: plan.activation,
        plan_benefits: plan.benefits,
        user_id: userId,
      };

      setSubmitStep('Generating serial number...');
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
      if (!serialRes.ok || serialData.error) throw new Error(serialData.error || 'Failed to generate serial number');
      const serialNumber = serialData.serial_number;

      setSubmitStep('Sending notification...');
      const pdfRes = await fetch(`${supabaseUrl}/functions/v1/generate-application-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          ...(supabaseKey ? { apikey: supabaseKey } : {}),
        },
        body: JSON.stringify({ ...payload, language: 'en', staff_email: user.email || '', serial_number: serialNumber }),
      });

      let emailSuccess = false;
      try {
        const pdfData = await pdfRes.json();
        emailSuccess = !!pdfData.success;
      } catch { /* noop */ }

      if (!emailSuccess) {
        toast({ title: 'Error', description: 'PDF/Email failed. Serial generated but email not sent.', variant: 'destructive' });
        return;
      }

      if (mobileNumber.length === 10) {
        try {
          await fetch(`${supabaseUrl}/functions/v1/send-confirmation-sms`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
              ...(supabaseKey ? { apikey: supabaseKey } : {}),
            },
            body: JSON.stringify({ mobile_number: mobileNumber, serial_number: serialNumber }),
          });
        } catch (err) { console.error('SMS error:', err); }
      }

      await supabase.from('applications').insert({
        serial_number: serialNumber,
        staff_user_id: userId,
        staff_email: user.email || '',
        member_name: payload.member_name,
        pdf_path: `${serialNumber}.pdf`,
      });

      toast({ title: 'Thank you!', description: `Your application has been submitted successfully. (Serial: ${serialNumber})` });
      form.reset();
      removeImage(setApplicantPhoto);
      removeImage(setAadhaarFront);
      removeImage(setAadhaarBack);
      setPaymentMethod('');
    } catch (error: any) {
      console.error('Submit Error:', error);
      toast({ title: 'Error', description: error?.message || 'Failed to submit. Please try again.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
      setSubmitStep('');
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md shadow-xl border-2">
          <CardContent className="p-8 text-center">
            <Lock className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-primary mb-2">Login Required</h2>
            <p className="text-muted-foreground mb-6">Please login to submit an application</p>
            <Button onClick={() => navigate('/login')} className="w-full">Go to Login</Button>
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
            <h2 className="text-2xl font-bold text-primary mb-2">Account Pending</h2>
            <p className="text-muted-foreground">Your account is pending admin approval. Please wait for approval to submit applications.</p>
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
            <h2 className="text-2xl font-bold text-destructive mb-2">{isTerminated ? 'Account Terminated' : 'Account Rejected'}</h2>
            <p className="text-muted-foreground">{isTerminated ? 'Your account has been terminated. Contact admin.' : 'Your account has been rejected. Please contact support.'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Photo upload tile (kept compact) ──
  const PhotoTile = ({ label, preview, onChange, onRemove, icon: Icon = Camera }: {
    label: string; preview: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemove: () => void; icon?: React.ElementType;
  }) => (
    <div className="flex flex-col items-center gap-3 p-4 border-2 border-dashed rounded-lg bg-muted/20">
      <Label className="text-base font-semibold flex items-center gap-2">
        <Icon className="w-5 h-5" /> {label}
      </Label>
      {preview ? (
        <div className="relative">
          <img src={preview} alt="Preview" className="w-28 h-28 object-cover rounded-lg border-2 shadow-md" loading="lazy" />
          <button type="button" onClick={onRemove} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className="cursor-pointer flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
          <Icon className="w-8 h-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground text-center">Tap to Upload / Capture</span>
          <input type="file" accept="image/*" capture="environment" onChange={onChange} className="hidden" />
        </label>
      )}
    </div>
  );

  // ── Aadhaar capture tile (smart camera + preview) ──
  const AadhaarTile = ({ label, preview, onCapture, onRemove }: {
    label: string; preview: string;
    onCapture: (file: File) => void; onRemove: () => void;
  }) => (
    <div className="flex flex-col items-center gap-3 p-4 border-2 border-dashed rounded-lg bg-muted/20">
      <Label className="text-base font-semibold flex items-center gap-2">
        <Shield className="w-5 h-5" /> {label}
      </Label>
      {preview ? (
        <div className="relative">
          <img src={preview} alt="Preview" className="w-44 h-28 object-cover rounded-lg border-2 shadow-md" loading="lazy" />
          <button type="button" onClick={onRemove} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <SmartAadhaarCapture label={`Scan ${label}`} onCapture={onCapture} />
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-xl border-2">
          <CardHeader className="text-center bg-primary/5 border-b">
            <CardTitle className="text-2xl md:text-3xl font-bold text-primary">Funeral Service Application</CardTitle>
            <p className="text-muted-foreground mt-2">Application Form</p>
          </CardHeader>

          <CardContent className="p-6">
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">

              {/* Plan selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" /> Choose Your Service Plan
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {PLANS.map((plan) => {
                    const Icon = PLAN_ICONS[plan.id];
                    const active = selectedPlan === plan.id;
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedPlan(plan.id)}
                        className={[
                          'text-left p-5 rounded-2xl border-2 transition-all duration-200 relative bg-background',
                          active
                            ? 'border-primary shadow-glow -translate-y-0.5'
                            : 'border-border hover:border-primary/50 hover:-translate-y-0.5',
                          plan.id === 'platinum' ? 'bg-gradient-to-b from-accent/30 to-background' : '',
                          plan.id === 'gold' && active ? 'bg-gradient-to-b from-primary/5 to-background' : '',
                        ].join(' ')}
                      >
                        {active && (
                          <span className="absolute top-3 right-3 inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                            <Icon size={18} />
                          </div>
                          <div>
                            <div className="font-display font-bold text-secondary tracking-wide">{plan.code}</div>
                            <div className="text-xs text-muted-foreground">{plan.name}</div>
                          </div>
                        </div>
                        <div className="text-2xl font-bold gradient-gold-text">{plan.amountLabel}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">Benefits Worth {plan.worthLabel}</div>
                        <ul className="mt-3 space-y-1.5">
                          {plan.benefits.map((b, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs text-foreground/85">
                              <Check className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-3 text-[11px] uppercase tracking-wide text-primary font-semibold">
                          Activation: {plan.activation}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Photo */}
              <PhotoTile
                label="Applicant Photo"
                preview={applicantPhoto.preview}
                onChange={(e) => handleFileInput(e, setApplicantPhoto)}
                onRemove={() => removeImage(setApplicantPhoto)}
                icon={Camera}
              />

              {/* Applicant details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" /> Applicant Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="member_name">Member Name</Label>
                    <Input id="member_name" name="member_name" placeholder="Enter your name" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="age">Age <span className="text-destructive">*</span></Label>
                    <Input id="age" name="age" type="number" min={1} max={120} required inputMode="numeric"
                      placeholder="Enter age" className="mt-1"
                      onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity('Enter a valid age between 1 and 120')}
                      onChange={(e) => (e.target as HTMLInputElement).setCustomValidity('')} />
                  </div>
                  <div>
                    <Label htmlFor="guardian_name">Father / Husband Name</Label>
                    <Input id="guardian_name" name="guardian_name" placeholder="Enter father/husband name" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <select id="gender" name="gender"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-ring">
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="occupation" className="flex items-center gap-1"><Briefcase className="w-4 h-4" /> Occupation</Label>
                    <Input id="occupation" name="occupation" placeholder="Enter occupation" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="ration_card" className="flex items-center gap-1"><CreditCard className="w-4 h-4" /> Ration Card Number</Label>
                    <Input id="ration_card" name="ration_card" placeholder="Enter ration card number" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="annual_income" className="flex items-center gap-1"><IndianRupee className="w-4 h-4" /> Annual Income (Max ₹1.75 Lakhs)</Label>
                    <Input id="annual_income" name="annual_income" placeholder="Enter annual income" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="aadhaar_number" className="flex items-center gap-1"><Shield className="w-4 h-4" /> Aadhaar Number (12 digits)</Label>
                    <Input id="aadhaar_number" name="aadhaar_number" placeholder="XXXX XXXX XXXX" maxLength={14} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="mobile_number" className="flex items-center gap-1"><Phone className="w-4 h-4" /> Mobile Number <span className="text-destructive">*</span></Label>
                    <Input id="mobile_number" name="mobile_number" type="tel" required maxLength={10} pattern="[0-9]{10}" inputMode="numeric"
                      placeholder="Enter mobile number" className="mt-1"
                      onInput={(e) => { const i = e.target as HTMLInputElement; i.value = i.value.replace(/\D/g, '').slice(0, 10); }}
                      onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity('Enter valid 10-digit mobile number')}
                      onChange={(e) => (e.target as HTMLInputElement).setCustomValidity('')} />
                  </div>
                  <div>
                    <Label className="flex items-center gap-1"><CreditCard className="w-4 h-4" /> Payment Method</Label>
                    <div className="flex gap-4 mt-2 h-10 items-center">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="payment_method_inline" value="Cash"
                          checked={paymentMethod === 'Cash'} onChange={(e) => setPaymentMethod(e.target.value)}
                          className="h-4 w-4 accent-primary" />
                        <span className="text-sm font-medium">Cash</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="payment_method_inline" value="UPI"
                          checked={paymentMethod === 'UPI'} onChange={(e) => setPaymentMethod(e.target.value)}
                          className="h-4 w-4 accent-primary" />
                        <span className="text-sm font-medium">UPI</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="address" className="flex items-center gap-1"><MapPin className="w-4 h-4" /> Permanent Address</Label>
                  <Textarea id="address" name="address" placeholder="Enter full address" className="mt-1" rows={3} />
                </div>
              </div>

              {/* Aadhaar (smart capture) */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" /> Aadhaar Card Images
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AadhaarTile
                    label="Aadhaar Front Side"
                    preview={aadhaarFront.preview}
                    onCapture={(f) => handleFile(f, setAadhaarFront)}
                    onRemove={() => removeImage(setAadhaarFront)}
                  />
                  <AadhaarTile
                    label="Aadhaar Back Side"
                    preview={aadhaarBack.preview}
                    onCapture={(f) => handleFile(f, setAadhaarBack)}
                    onRemove={() => removeImage(setAadhaarBack)}
                  />
                </div>
              </div>

              {/* Nominee 1 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" /> Nominee 1 (Required)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label htmlFor="nominee1_name">Nominee Name</Label>
                    <Input id="nominee1_name" name="nominee1_name" placeholder="Enter nominee name" className="mt-1" /></div>
                  <div><Label htmlFor="nominee1_gender">Gender</Label>
                    <select id="nominee1_gender" name="nominee1_gender"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-ring">
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select></div>
                  <div><Label htmlFor="nominee1_age">Age</Label>
                    <Input id="nominee1_age" name="nominee1_age" type="number" placeholder="Age" className="mt-1" /></div>
                  <div><Label htmlFor="nominee1_relation">Relationship</Label>
                    <select id="nominee1_relation" name="nominee1_relation"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-ring">
                      <option value="">Select Relationship</option>
                      <option value="Son">Son</option>
                      <option value="Daughter">Daughter</option>
                      <option value="Wife">Wife</option>
                      <option value="Husband">Husband</option>
                      <option value="Spouse">Spouse</option>
                    </select></div>
                </div>
              </div>

              {/* Nominee 2 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" /> Nominee 2 (Optional)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label htmlFor="nominee2_name">Nominee Name</Label>
                    <Input id="nominee2_name" name="nominee2_name" placeholder="Enter nominee name" className="mt-1" /></div>
                  <div><Label htmlFor="nominee2_gender">Gender</Label>
                    <select id="nominee2_gender" name="nominee2_gender"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-ring">
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select></div>
                  <div><Label htmlFor="nominee2_age">Age</Label>
                    <Input id="nominee2_age" name="nominee2_age" type="number" placeholder="Age" className="mt-1" /></div>
                  <div><Label htmlFor="nominee2_relation">Relationship</Label>
                    <select id="nominee2_relation" name="nominee2_relation"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-ring">
                      <option value="">Select Relationship</option>
                      <option value="Son">Son</option>
                      <option value="Daughter">Daughter</option>
                      <option value="Wife">Wife</option>
                      <option value="Husband">Husband</option>
                      <option value="Spouse">Spouse</option>
                    </select></div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="additional_message">Additional Message (Optional)</Label>
                <Textarea id="additional_message" name="additional_message" placeholder="Any additional information..." rows={3} />
              </div>

              <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" />{submitStep || 'Submitting...'}</>
                ) : (
                  <><Send className="mr-2 h-5 w-5" />Submit Application</>
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
