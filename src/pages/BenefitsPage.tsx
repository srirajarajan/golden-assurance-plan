import { useLanguage } from '@/contexts/LanguageContext';
import PlansSection from '@/components/PlansSection';

const BenefitsPage = () => {
  const { language } = useLanguage();

  return (
    <main className="min-h-screen py-12 md:py-16 bg-muted/30">
      <PlansSection />

      <div className="container mx-auto px-4 mt-8">
        <div className="card-elevated max-w-3xl mx-auto p-6 bg-secondary text-secondary-foreground text-center">
          <p className="text-lg">
            {language === 'ta'
              ? 'மேலும் விவரங்களுக்கு எங்களை தொடர்பு கொள்ளுங்கள்'
              : 'Contact us for more details'}
          </p>
          <p className="text-2xl font-bold mt-2 text-gold-light">96003 50699 / 96003 50889</p>
        </div>
      </div>
    </main>
  );
};

export default BenefitsPage;
