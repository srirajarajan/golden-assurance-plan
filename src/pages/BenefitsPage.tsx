import { useLanguage } from '@/contexts/LanguageContext';
import { Check, FileText, FileCheck } from 'lucide-react';

const BenefitsPage = () => {
  const { t, language } = useLanguage();

  return (
    <main className="min-h-screen py-12 md:py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-secondary mb-4">
            {t.benefits.title}
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t.benefits.subtitle}</p>
          <div className="w-24 h-1 bg-primary mx-auto rounded-full mt-4" />
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Benefits List */}
          <div className="card-elevated p-6 md:p-10 gold-border animate-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="text-primary" size={24} />
              </div>
              <h2 className="font-display text-2xl font-semibold text-secondary">
                {language === 'ta' ? 'திட்ட சலுகைகள்' : 'Scheme Benefits'}
              </h2>
            </div>

            <ul className="space-y-4">
              {t.benefits.benefitsList.map((benefit, index) => (
                <li
                  key={index}
                  className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 hover:bg-primary/5 transition-colors"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="text-primary" size={18} />
                  </div>
                  <span className="text-foreground/90 leading-relaxed">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Required Documents */}
          <div className="card-elevated p-6 md:p-10 gold-border animate-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <FileCheck className="text-primary" size={24} />
              </div>
              <h2 className="font-display text-2xl font-semibold text-secondary">
                {t.benefits.documentsTitle}
              </h2>
            </div>

            <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {t.benefits.documents.map((doc, index) => (
                <li
                  key={index}
                  className="flex items-center gap-3 p-4 rounded-xl bg-accent/30 border border-primary/20"
                >
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <span className="font-medium text-foreground/90">{doc}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Important Note */}
          <div className="card-elevated p-6 bg-secondary text-secondary-foreground text-center animate-fade-in">
            <p className="text-lg">
              {language === 'ta'
                ? 'மேலும் விவரங்களுக்கு எங்களை தொடர்பு கொள்ளுங்கள்'
                : 'Contact us for more details'}
            </p>
            <p className="text-2xl font-bold mt-2 text-gold-light">96003 50699 / 96003 50889</p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default BenefitsPage;
