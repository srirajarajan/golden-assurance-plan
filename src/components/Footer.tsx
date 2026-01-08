import { useLanguage } from '@/contexts/LanguageContext';
import { Phone, MapPin, Heart, Mail } from 'lucide-react';
import logo from '@/assets/logo.png';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo & Tagline */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <img src={logo} alt="William Carey Insurance" className="h-20 w-20 object-contain" />
            <p className="text-sm text-secondary-foreground/80 text-center md:text-left">
              {t.footer.tagline}
            </p>
          </div>

          {/* Contact Info */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <h4 className="font-display text-lg font-semibold text-gold-light mb-2">
              {t.contact.title}
            </h4>
            <div className="flex items-center gap-2 text-sm text-secondary-foreground/80">
              <Phone size={16} className="text-gold-light" />
              <span>96003 50699 / 96003 50889</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-secondary-foreground/80">
              <Mail size={16} className="text-gold-light" />
              <span>{t.footer.email}</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-secondary-foreground/80">
              <MapPin size={16} className="text-gold-light mt-1 flex-shrink-0" />
              <span>{t.contact.addressText}</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <h4 className="font-display text-lg font-semibold text-gold-light mb-2">
              {t.nav.benefits}
            </h4>
            <p className="text-sm text-secondary-foreground/80 text-center md:text-left">
              {t.hero.subtitle}
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-secondary-foreground/20 flex flex-col md:flex-row items-center justify-center gap-2 text-sm text-secondary-foreground/60">
          <span>© 2025 William Carey Insurance.</span>
          <span className="flex items-center gap-1">
            {t.footer.rights} <Heart size={14} className="text-gold-light" />
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
