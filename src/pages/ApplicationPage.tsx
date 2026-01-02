import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { User, Phone, CreditCard, IndianRupee, Mail, MessageSquare } from 'lucide-react';

const ApplicationPage = () => {
  const { t, language } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

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
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-secondary mb-4">
              {t.form.title}
            </h1>
            <div className="w-24 h-1 bg-primary mx-auto rounded-full" />
          </div>

          <form
            ref={formRef}
            onSubmit={handleSubmit}
            method="POST"
            className="card-elevated p-6 md:p-10 gold-border animate-slide-up space-y-6"
          >
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name" className="flex items-center gap-2">
                <User size={16} className="text-primary" />
                {t.form.memberName}
              </Label>
              <Input
                id="full_name"
                name="full_name"
                required
                className="rounded-xl"
                placeholder={language === 'ta' ? 'முழு பெயர்' : 'Enter your full name'}
              />
            </div>

            {/* Email Address */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail size={16} className="text-primary" />
                {language === 'ta' ? 'மின்னஞ்சல் முகவரி' : 'Email Address'}
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                className="rounded-xl"
                placeholder={language === 'ta' ? 'example@email.com' : 'example@email.com'}
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone size={16} className="text-primary" />
                {t.form.phone}
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                required
                className="rounded-xl"
                placeholder={language === 'ta' ? 'கைபேசி எண்' : 'Enter your phone number'}
              />
            </div>

            {/* Ration Card Number */}
            <div className="space-y-2">
              <Label htmlFor="ration_card" className="flex items-center gap-2">
                <CreditCard size={16} className="text-primary" />
                {t.form.rationCard}
              </Label>
              <Input
                id="ration_card"
                name="ration_card"
                required
                className="rounded-xl"
                placeholder={language === 'ta' ? 'குடும்ப அட்டை எண்' : 'Enter ration card number'}
              />
            </div>

            {/* Annual Income */}
            <div className="space-y-2">
              <Label htmlFor="annual_income" className="flex items-center gap-2">
                <IndianRupee size={16} className="text-primary" />
                {t.form.annualIncome}
              </Label>
              <Input
                id="annual_income"
                name="annual_income"
                required
                className="rounded-xl"
                placeholder={language === 'ta' ? 'ஆண்டு வருமானம்' : 'Enter annual income'}
              />
            </div>

            {/* Message / Application Details */}
            <div className="space-y-2">
              <Label htmlFor="message" className="flex items-center gap-2">
                <MessageSquare size={16} className="text-primary" />
                {language === 'ta' ? 'கூடுதல் விவரங்கள்' : 'Message / Application Details'}
              </Label>
              <Textarea
                id="message"
                name="message"
                required
                className="rounded-xl min-h-[120px]"
                placeholder={
                  language === 'ta'
                    ? 'உங்கள் விண்ணப்பம் பற்றிய கூடுதல் தகவல்களை இங்கே எழுதுங்கள்...'
                    : 'Enter any additional details about your application...'
                }
              />
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
                : t.form.submit}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
};

export default ApplicationPage;
