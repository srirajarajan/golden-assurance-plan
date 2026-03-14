import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Phone, MapPin, Send, MessageCircle, Mail } from 'lucide-react';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(6).max(20),
  message: z.string().trim().min(1).max(1000),
});

const ContactPage = () => {
  const { t, language } = useLanguage();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = contactSchema.safeParse(formData);
    if (!parsed.success) {
      toast({
        title: language === 'ta' ? 'பிழை!' : 'Error',
        description:
          language === 'ta'
            ? 'சரியான விவரங்களை உள்ளிடவும்.'
            : 'Please enter valid details.',
        variant: 'destructive',
      });
      return;
    }

    // Show redirecting state
    setIsRedirecting(true);

    // Build the WhatsApp message
    const whatsappMessage = `Hello 👋

I would like to know more about William Carey Funeral Insurance.

Name: ${parsed.data.name}
Phone: ${parsed.data.phone}
Email: ${parsed.data.email}
Message: ${parsed.data.message}`;

    // Redirect to WhatsApp using wa.me
    const whatsappUrl = `https://wa.me/919600350699?text=${encodeURIComponent(whatsappMessage)}`;
    
    // Use window.location.href for reliable redirect
    window.location.href = whatsappUrl;
  };

  const whatsappUrl = `https://wa.me/919600350699?text=${encodeURIComponent(
    'Hello, I would like to know more about William Carey Funeral Insurance.'
  )}`;

  return (
    <main className="min-h-screen py-12 md:py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-secondary mb-4">
            {t.contact.title}
          </h1>
          <p className="text-muted-foreground text-lg">{t.contact.subtitle}</p>
          <div className="w-24 h-1 bg-primary mx-auto rounded-full mt-4" />
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Info */}
          <div className="space-y-6 animate-slide-up">
            {/* Phone Numbers */}
            <div className="card-elevated p-6 gold-border">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Phone className="text-primary" size={24} />
                </div>
                <h3 className="font-display text-xl font-semibold text-secondary">
                  {t.contact.phone}
                </h3>
              </div>
              <div className="space-y-2 text-lg">
                <a
                  href="tel:+919600350699"
                  className="block text-foreground hover:text-primary transition-colors"
                >
                  96003 50699
                </a>
                <a
                  href="tel:+919600350889"
                  className="block text-foreground hover:text-primary transition-colors"
                >
                  96003 50889
                </a>
              </div>
            </div>

            {/* Email */}
            <div className="card-elevated p-6 gold-border">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="text-primary" size={24} />
                </div>
                <h3 className="font-display text-xl font-semibold text-secondary">
                  {t.contact.email}
                </h3>
              </div>
              <a
                href="mailto:williamcareyfuneral99@gmail.com"
                className="block text-lg text-foreground hover:text-primary transition-colors"
              >
                📧 williamcareyfuneral99@gmail.com
              </a>
            </div>

            {/* Address */}
            <div className="card-elevated p-6 gold-border">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="text-primary" size={24} />
                </div>
                <h3 className="font-display text-xl font-semibold text-secondary">
                  {t.contact.address}
                </h3>
              </div>
              <p className="text-foreground/80 leading-relaxed">{t.contact.addressText}</p>
            </div>

            {/* WhatsApp Button */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="card-elevated p-6 flex items-center gap-4 bg-green-50 border border-green-200 hover:bg-green-100 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                <MessageCircle className="text-white" size={24} fill="white" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-green-700">
                  {t.contact.whatsapp}
                </h3>
                <p className="text-green-600 text-sm">
                  {language === 'ta' ? 'உடனடி பதில்' : 'Instant response'}
                </p>
              </div>
            </a>

            {/* Google Maps */}
            <div className="card-elevated overflow-hidden gold-border">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3907.9762308611184!2d78.1466!3d11.6545!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTHCsDM5JzE2LjIiTiA3OMKwMDgnNDcuOCJF!5e0!3m2!1sen!2sin!4v1234567890"
                width="100%"
                height="250"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Office Location"
              />
            </div>
          </div>

          {/* Contact Form */}
          <div className="card-elevated p-6 md:p-8 gold-border animate-slide-up">
            <h3 className="font-display text-2xl font-semibold text-secondary mb-6">
              {t.contact.formTitle}
            </h3>

            <form onSubmit={handleSubmit} method="post" className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="contactName">{t.contact.name}</Label>
                <Input
                  id="contactName"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">{t.contact.emailLabel}</Label>
                <Input
                  id="contactEmail"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">{t.contact.phoneLabel}</Label>
                <Input
                  id="contactPhone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactMessage">{t.contact.message}</Label>
                <Textarea
                  id="contactMessage"
                  name="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  className="rounded-xl min-h-[150px]"
                />
              </div>

              <Button 
                type="submit" 
                size="lg" 
                className="w-full rounded-xl text-lg py-6 shadow-glow"
                disabled={isRedirecting}
              >
                <Send size={20} className="mr-2" />
                {isRedirecting 
                  ? (language === 'ta' ? 'வாட்ஸ்அப்பிற்கு திருப்பி விடப்படுகிறது…' : 'Redirecting to WhatsApp…')
                  : t.contact.send
                }
              </Button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ContactPage;
