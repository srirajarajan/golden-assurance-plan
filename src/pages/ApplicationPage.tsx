import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { User, Phone, CreditCard, MapPin, Upload, Users, IndianRupee } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const ApplicationPage = () => {
  const { t, language } = useLanguage();
  const [photo, setPhoto] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    memberName: '',
    fatherName: '',
    gender: '',
    occupation: '',
    phone: '',
    rationCard: '',
    annualIncome: '',
    aadharCard: '',
    address: '',
  });

  const [nominees, setNominees] = useState([
    { name: '', gender: '', age: '', relation: '' },
    { name: '', gender: '', age: '', relation: '' },
  ]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNomineeChange = (index: number, field: string, value: string) => {
    setNominees(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-application', {
        body: {
          ...formData,
          nominees,
        },
      });

      if (error) throw error;

      toast({
        title: language === 'ta' ? 'விண்ணப்பம் சமர்ப்பிக்கப்பட்டது!' : 'Application Submitted!',
        description:
          language === 'ta'
            ? 'உங்கள் விண்ணப்பம் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது. விரைவில் தொடர்பு கொள்வோம்.'
            : 'Your application has been submitted successfully. We will contact you shortly.',
      });

      // Reset form
      setFormData({
        memberName: '',
        fatherName: '',
        gender: '',
        occupation: '',
        phone: '',
        rationCard: '',
        annualIncome: '',
        aadharCard: '',
        address: '',
      });
      setNominees([
        { name: '', gender: '', age: '', relation: '' },
        { name: '', gender: '', age: '', relation: '' },
      ]);
      setPhoto(null);
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({
        title: language === 'ta' ? 'பிழை!' : 'Error!',
        description: language === 'ta' 
          ? 'விண்ணப்பத்தை சமர்ப்பிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.'
          : 'Failed to submit application. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  return (
    <main className="min-h-screen py-12 md:py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-secondary mb-4">
              {t.form.title}
            </h1>
            <div className="w-24 h-1 bg-primary mx-auto rounded-full" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="card-elevated p-6 md:p-10 gold-border animate-slide-up">
            {/* Personal Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-2">
                <Label htmlFor="memberName" className="flex items-center gap-2">
                  <User size={16} className="text-primary" />
                  {t.form.memberName}
                </Label>
                <Input 
                  id="memberName" 
                  required 
                  className="rounded-xl" 
                  value={formData.memberName}
                  onChange={(e) => handleInputChange('memberName', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fatherName" className="flex items-center gap-2">
                  <User size={16} className="text-primary" />
                  {t.form.fatherHusbandName}
                </Label>
                <Input 
                  id="fatherName" 
                  required 
                  className="rounded-xl" 
                  value={formData.fatherName}
                  onChange={(e) => handleInputChange('fatherName', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender" className="flex items-center gap-2">
                  <Users size={16} className="text-primary" />
                  {t.form.gender}
                </Label>
                <Select 
                  required 
                  value={formData.gender}
                  onValueChange={(value) => handleInputChange('gender', value)}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder={t.form.selectGender} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">{t.form.male}</SelectItem>
                    <SelectItem value="female">{t.form.female}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="occupation">{t.form.occupation}</Label>
                <Input 
                  id="occupation" 
                  required 
                  className="rounded-xl" 
                  value={formData.occupation}
                  onChange={(e) => handleInputChange('occupation', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone size={16} className="text-primary" />
                  {t.form.phone}
                </Label>
                <Input 
                  id="phone" 
                  type="tel" 
                  required 
                  className="rounded-xl" 
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rationCard" className="flex items-center gap-2">
                  <CreditCard size={16} className="text-primary" />
                  {t.form.rationCard}
                </Label>
                <Input 
                  id="rationCard" 
                  required 
                  className="rounded-xl" 
                  value={formData.rationCard}
                  onChange={(e) => handleInputChange('rationCard', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="annualIncome" className="flex items-center gap-2">
                  <IndianRupee size={16} className="text-primary" />
                  {t.form.annualIncome}
                </Label>
                <Input 
                  id="annualIncome" 
                  required 
                  className="rounded-xl" 
                  value={formData.annualIncome}
                  onChange={(e) => handleInputChange('annualIncome', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="aadharCard" className="flex items-center gap-2">
                  <CreditCard size={16} className="text-primary" />
                  {t.form.aadharCard}
                </Label>
                <Input 
                  id="aadharCard" 
                  required 
                  className="rounded-xl" 
                  value={formData.aadharCard}
                  onChange={(e) => handleInputChange('aadharCard', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="photo" className="flex items-center gap-2">
                  <Upload size={16} className="text-primary" />
                  {t.form.uploadPhoto}
                </Label>
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="rounded-xl"
                />
              </div>
            </div>

            {/* Address */}
            <div className="mb-8">
              <Label htmlFor="address" className="flex items-center gap-2 mb-2">
                <MapPin size={16} className="text-primary" />
                {t.form.permanentAddress}
              </Label>
              <Textarea 
                id="address" 
                required 
                className="rounded-xl min-h-[100px]" 
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
              />
            </div>

            {/* Nominee Section */}
            <div className="mb-8">
              <h3 className="font-display text-xl font-semibold text-secondary mb-4 flex items-center gap-2">
                <Users size={20} className="text-primary" />
                {t.form.nomineeSection}
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-primary/10">
                      <th className="border border-border p-3 text-left text-sm font-medium">
                        {t.form.no}
                      </th>
                      <th className="border border-border p-3 text-left text-sm font-medium">
                        {t.form.name}
                      </th>
                      <th className="border border-border p-3 text-left text-sm font-medium">
                        {t.form.gender}
                      </th>
                      <th className="border border-border p-3 text-left text-sm font-medium">
                        {t.form.age}
                      </th>
                      <th className="border border-border p-3 text-left text-sm font-medium">
                        {t.form.relation}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {nominees.map((nominee, index) => (
                      <tr key={index}>
                        <td className="border border-border p-3 text-center">{index + 1}</td>
                        <td className="border border-border p-2">
                          <Input 
                            className="rounded-lg border-0 bg-transparent" 
                            value={nominee.name}
                            onChange={(e) => handleNomineeChange(index, 'name', e.target.value)}
                          />
                        </td>
                        <td className="border border-border p-2">
                          <Select
                            value={nominee.gender}
                            onValueChange={(value) => handleNomineeChange(index, 'gender', value)}
                          >
                            <SelectTrigger className="rounded-lg border-0 bg-transparent">
                              <SelectValue placeholder="-" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">{t.form.male}</SelectItem>
                              <SelectItem value="female">{t.form.female}</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="border border-border p-2">
                          <Input 
                            type="number" 
                            className="rounded-lg border-0 bg-transparent" 
                            value={nominee.age}
                            onChange={(e) => handleNomineeChange(index, 'age', e.target.value)}
                          />
                        </td>
                        <td className="border border-border p-2">
                          <Select
                            value={nominee.relation}
                            onValueChange={(value) => handleNomineeChange(index, 'relation', value)}
                          >
                            <SelectTrigger className="rounded-lg border-0 bg-transparent">
                              <SelectValue placeholder={t.form.selectRelation} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="spouse">{t.form.spouse}</SelectItem>
                              <SelectItem value="child">{t.form.child}</SelectItem>
                              <SelectItem value="parent">{t.form.parent}</SelectItem>
                              <SelectItem value="sibling">{t.form.sibling}</SelectItem>
                              <SelectItem value="other">{t.form.other}</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-2">
                <Label>{t.form.applicantSignature}</Label>
                <div className="h-24 border-2 border-dashed border-border rounded-xl bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label>{t.form.mdSignature}</Label>
                <div className="h-24 border-2 border-dashed border-border rounded-xl bg-muted/50" />
              </div>
            </div>

            {/* Submit */}
            <Button 
              type="submit" 
              size="lg" 
              className="w-full rounded-xl text-lg py-6 shadow-glow"
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? (language === 'ta' ? 'சமர்ப்பிக்கிறது...' : 'Submitting...') 
                : t.form.submit}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
};

export default ApplicationPage;
