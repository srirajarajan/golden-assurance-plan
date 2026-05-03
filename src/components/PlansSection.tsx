import { useLanguage } from '@/contexts/LanguageContext';
import { Check, Crown, Sparkles, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

type Plan = {
  id: 'silver' | 'gold' | 'platinum';
  name: string;
  price: string;
  taglineEn: string;
  taglineTa: string;
  featuresEn: string[];
  featuresTa: string[];
  popular?: boolean;
  premium?: boolean;
  Icon: typeof Star;
};

const plans: Plan[] = [
  {
    id: 'silver',
    name: 'SILVER',
    price: '₹15,000',
    taglineEn: 'Dignified Funeral Service',
    taglineTa: 'கண்ணியமான ஈமச்சடங்கு',
    Icon: Star,
    featuresEn: [
      'Amarar vehicle (within 10 km)',
      'Basic funeral items',
      'Burial ground assistance',
      'Basic priest service',
    ],
    featuresTa: [
      'அமரர் வாகனம் (10 கி.மீ வரை)',
      'அடிப்படை ஈமச்சடங்கு பொருட்கள்',
      'மயான உதவி',
      'அடிப்படை பூசாரி சேவை',
    ],
  },
  {
    id: 'gold',
    name: 'GOLD',
    price: '₹25,000',
    taglineEn: 'Complete Family Care',
    taglineTa: 'முழுமையான பாதுகாப்பு',
    Icon: Sparkles,
    popular: true,
    featuresEn: [
      'AC vehicle with decoration',
      'Ice box (24 hrs)',
      'Full cremation setup (wood + ghee)',
      'Priest with full rituals',
      'Burial fees handled',
      '4 helpers',
    ],
    featuresTa: [
      'AC வாகனம் (அலங்காரத்துடன்)',
      'ஐஸ் பெட்டி (24 மணி நேரம்)',
      'முழு தகனம் ஏற்பாடு (விறகு + நெய்)',
      'பூசாரி – முழு சடங்குகள்',
      'மயான கட்டணம் ஏற்கப்படும்',
      '4 உதவியாளர்கள்',
    ],
  },
  {
    id: 'platinum',
    name: 'PLATINUM',
    price: '₹35,000',
    taglineEn: 'Royal Honour Procession',
    taglineTa: 'ராஜ மரியாதை இறுதி ஊர்வலம்',
    Icon: Crown,
    premium: true,
    featuresEn: [
      'Everything in Gold plan',
      'Tent + chairs + mic setup',
      'Band / music',
      'Photo & video coverage',
      'Ash collection service',
      '10th day ceremony support',
    ],
    featuresTa: [
      'Gold திட்டத்தில் உள்ள அனைத்தும்',
      'டென்ட் + நாற்காலிகள் + மைக் ஏற்பாடு',
      'மேளம் / இசைக்குழு',
      'புகைப்படம் & வீடியோ பதிவு',
      'அஸ்தி எடுக்கும் சேவை',
    '10ம் நாள் சடங்கு ஆதரவு',
    ],
  },
];

const PlansSection = () => {
  const { language } = useLanguage();
  const isTa = language === 'ta';

  return (
    <section className="py-16 md:py-24" id="plans">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-secondary mb-3">
            {isTa ? 'எங்கள் சேவை திட்டங்கள்' : 'Our Service Packages'}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {isTa
              ? 'உங்கள் குடும்பத்திற்கு பொருத்தமான தொகுப்பை தேர்ந்தெடுங்கள்'
              : 'Choose the package that suits your family best'}
          </p>
          <div className="w-24 h-1 bg-primary mx-auto rounded-full mt-4" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-stretch max-w-6xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.Icon;
            const features = isTa ? plan.featuresTa : plan.featuresEn;
            const tagline = isTa ? plan.taglineTa : plan.taglineEn;

            const cardClasses = [
              'card-elevated relative flex flex-col p-6 md:p-8 rounded-2xl transition-all duration-300 hover:-translate-y-1',
              plan.popular
                ? 'border-2 border-primary shadow-glow md:scale-105 bg-gradient-to-b from-primary/5 to-background'
                : '',
              plan.premium
                ? 'gold-border bg-gradient-to-b from-accent/30 to-background'
                : '',
              !plan.popular && !plan.premium ? 'border border-border' : '',
            ].join(' ');

            return (
              <div key={plan.id} className={cardClasses}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full shadow-md">
                      <Sparkles size={12} />
                      {isTa ? 'மிகவும் பிரபலம்' : 'Most Popular'}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Icon size={24} />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-secondary tracking-wide">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">{tagline}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="text-4xl md:text-5xl font-bold gradient-gold-text">
                    {plan.price}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isTa ? 'ஒரு முறை சேவை கட்டணம்' : 'One-time service charge'}
                  </p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                      <Check size={16} className="text-primary mt-0.5 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  size="lg"
                  variant={plan.popular ? 'default' : 'outline'}
                  className="w-full rounded-xl"
                >
                  <Link to="/apply">
                    {isTa ? 'திட்டத்தை தேர்வு செய்' : 'Choose Plan'}
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PlansSection;