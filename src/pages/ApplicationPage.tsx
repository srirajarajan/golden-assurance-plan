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
import { User, Phone, CreditCard, MapPin, Upload, Users } from 'lucide-react';

const ApplicationPage = () => {
  const { t, language } = useLanguage();
  const [photo, setPhoto] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: language === 'ta' ? 'விண்ணப்பம் சமர்ப்பிக்கப்பட்டது!' : 'Application Submitted!',
      description:
        language === 'ta'
          ? 'உங்கள் விண்ணப்பம் பெறப்பட்டது. விரைவில் தொடர்பு கொள்வோம்.'
          : 'Your application has been received. We will contact you soon.',
    });
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
                <Input id="memberName" required className="rounded-xl" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fatherName" className="flex items-center gap-2">
                  <User size={16} className="text-primary" />
                  {t.form.fatherHusbandName}
                </Label>
                <Input id="fatherName" required className="rounded-xl" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender" className="flex items-center gap-2">
                  <Users size={16} className="text-primary" />
                  {t.form.gender}
                </Label>
                <Select required>
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
                <Input id="occupation" required className="rounded-xl" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone size={16} className="text-primary" />
                  {t.form.phone}
                </Label>
                <Input id="phone" type="tel" required className="rounded-xl" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rationCard" className="flex items-center gap-2">
                  <CreditCard size={16} className="text-primary" />
                  {t.form.rationCard}
                </Label>
                <Input id="rationCard" required className="rounded-xl" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="aadharCard" className="flex items-center gap-2">
                  <CreditCard size={16} className="text-primary" />
                  {t.form.aadharCard}
                </Label>
                <Input id="aadharCard" required className="rounded-xl" />
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
              <Textarea id="address" required className="rounded-xl min-h-[100px]" />
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
                    {[1, 2].map((num) => (
                      <tr key={num}>
                        <td className="border border-border p-3 text-center">{num}</td>
                        <td className="border border-border p-2">
                          <Input className="rounded-lg border-0 bg-transparent" />
                        </td>
                        <td className="border border-border p-2">
                          <Select>
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
                          <Input type="number" className="rounded-lg border-0 bg-transparent" />
                        </td>
                        <td className="border border-border p-2">
                          <Select>
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
            <Button type="submit" size="lg" className="w-full rounded-xl text-lg py-6 shadow-glow">
              {t.form.submit}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
};

export default ApplicationPage;
