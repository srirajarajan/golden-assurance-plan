import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, HeartHandshake, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';
import PlansSection from '@/components/PlansSection';

const HomePage = () => {
  const { t, language } = useLanguage();

  const features = [
    {
      icon: Shield,
      titleEn: 'Trusted Service',
      titleTa: 'நம்பகமான சேவை',
      descEn: 'Professional, respectful funeral services handled with utmost dignity',
      descTa: 'மரியாதையுடன், தொழில் முறையில் கையாளப்படும் ஈமச்சடங்கு சேவைகள்',
    },
    {
      icon: HeartHandshake,
      titleEn: 'Family Support',
      titleTa: 'குடும்ப ஆதரவு',
      descEn: 'End-to-end support for families during their most difficult moments',
      descTa: 'கடினமான தருணங்களில் முழுமையான குடும்ப ஆதரவு',
    },
    {
      icon: Clock,
      titleEn: '24/7 Availability',
      titleTa: '24/7 சேவை',
      descEn: 'Available round the clock to respond whenever you need us',
      descTa: 'எப்போது வேண்டுமானாலும் உடனடி உதவிக்கு கிடைக்கிறோம்',
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
                  alt="William Carey Funeral Services Pvt. Ltd."
                  className="relative h-32 w-32 md:h-40 md:w-40 object-contain gold-glow rounded-full"
                />
              </div>
            </div>

            {/* Title */}
            <div className="gold-border rounded-2xl p-6 md:p-8 bg-background/50 backdrop-blur-sm mb-8 animate-slide-up">
              <h1 className="font-display text-2xl md:text-4xl lg:text-5xl font-bold text-secondary leading-tight">
                {t.hero.title}
              </h1>
              <p className="font-display text-base md:text-lg text-muted-foreground mt-3">
                {language === 'ta'
                  ? 'William Carey Funeral Services Pvt. Ltd.'
                  : 'வில்லியம் கேரி ஈமச்சடங்கு சேவைகள் பிரைவேட் லிமிடெட்'}
              </p>
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
            {features.map((feature, index) => (
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
            ))}
          </div>
        </div>
      </section>

      {/* Service Plans */}
      <PlansSection />
    </main>
  );
};

export default HomePage;
