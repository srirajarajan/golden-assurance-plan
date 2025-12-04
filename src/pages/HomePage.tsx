import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';

const HomePage = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: Shield,
      titleEn: 'Secure Coverage',
      titleTa: 'பாதுகாப்பான காப்பீடு',
      descEn: 'Comprehensive funeral expense coverage for your family',
      descTa: 'உங்கள் குடும்பத்திற்கு முழுமையான இறுதிச்சடங்கு செலவு காப்பீடு',
    },
    {
      icon: Users,
      titleEn: 'Family Protection',
      titleTa: 'குடும்ப பாதுகாப்பு',
      descEn: 'Cover up to 5 family members under one policy',
      descTa: 'ஒரு பாலிசியில் 5 குடும்ப உறுப்பினர்கள் வரை காப்பீடு',
    },
    {
      icon: Clock,
      titleEn: 'Quick Settlement',
      titleTa: 'விரைவான தீர்வு',
      descEn: 'Claims processed within 7 working days',
      descTa: '7 வேலை நாட்களுக்குள் உரிமை தீர்வு',
    },
  ];

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-gradient relative overflow-hidden py-16 md:py-24">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            {/* Logo with glow */}
            <div className="mb-8 animate-scale-in">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl scale-150" />
                <img
                  src={logo}
                  alt="William Carey Insurance"
                  className="relative h-32 w-32 md:h-40 md:w-40 object-contain gold-glow rounded-full"
                />
              </div>
            </div>

            {/* Title */}
            <div className="gold-border rounded-2xl p-6 md:p-8 bg-background/50 backdrop-blur-sm mb-8 animate-slide-up">
              <h1 className="font-display text-2xl md:text-4xl lg:text-5xl font-bold text-secondary leading-tight">
                {t.hero.title}
              </h1>
            </div>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-muted-foreground mb-10 animate-fade-in max-w-2xl">
              {t.hero.subtitle}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in">
              <Button asChild size="lg" className="text-lg px-8 py-6 rounded-xl shadow-glow">
                <Link to="/apply">
                  {t.hero.applyBtn}
                  <ArrowRight className="ml-2" size={20} />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 rounded-xl border-2 border-primary/50 hover:bg-primary/10"
              >
                <Link to="/benefits">{t.hero.benefitsBtn}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const { t: trans, language } = useLanguage();
              return (
                <div
                  key={index}
                  className="card-elevated p-8 text-center hover:shadow-glow transition-all duration-300 hover:-translate-y-1"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
                    <feature.icon size={32} />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-secondary mb-3">
                    {language === 'ta' ? feature.titleTa : feature.titleEn}
                  </h3>
                  <p className="text-muted-foreground">
                    {language === 'ta' ? feature.descTa : feature.descEn}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Premium Amount Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="card-elevated max-w-2xl mx-auto p-8 md:p-12 text-center gold-border">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-secondary mb-4">
              {useLanguage().language === 'ta' ? 'ஆண்டு பிரீமியம்' : 'Annual Premium'}
            </h2>
            <div className="text-5xl md:text-6xl font-bold gradient-gold-text mb-4">₹500</div>
            <p className="text-muted-foreground mb-6">
              {useLanguage().language === 'ta'
                ? 'ஒரு குடும்பத்திற்கு ஆண்டுக்கு'
                : 'Per family per year'}
            </p>
            <p className="text-lg font-medium text-secondary">
              {useLanguage().language === 'ta'
                ? 'காப்பீட்டு தொகை: ₹50,000'
                : 'Coverage Amount: ₹50,000'}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
