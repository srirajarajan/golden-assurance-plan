import { Link } from 'react-router-dom';
import { Star, Sparkles, Crown, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PLANS } from '@/data/plans';

const ICONS = { silver: Star, gold: Sparkles, platinum: Crown } as const;

const PlansSection = () => {
  return (
    <section className="py-16 md:py-24" id="plans">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-secondary mb-3">
            Our Service Packages
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Choose the package that suits your family best
          </p>
          <div className="w-24 h-1 bg-primary mx-auto rounded-full mt-4" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-stretch max-w-6xl mx-auto">
          {PLANS.map((plan) => {
            const Icon = ICONS[plan.id];
            const isGold = plan.id === 'gold';
            const isPlatinum = plan.id === 'platinum';

            const cardClasses = [
              'card-elevated relative flex flex-col p-6 md:p-8 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-glow',
              isGold ? 'border-2 border-primary md:scale-105 bg-gradient-to-b from-primary/5 to-background' : '',
              isPlatinum ? 'gold-border bg-gradient-to-b from-accent/30 to-background' : '',
              !isGold && !isPlatinum ? 'border border-border' : '',
            ].join(' ');

            return (
              <div key={plan.id} className={cardClasses}>
                {isGold && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full shadow-md">
                      <Sparkles size={12} /> Most Popular
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Icon size={24} />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-secondary tracking-wide">
                      {plan.code} PLAN
                    </h3>
                    <p className="text-xs text-muted-foreground">{plan.name}</p>
                  </div>
                </div>

                <div className="mb-6 flex-1">
                  <div className="text-4xl md:text-5xl font-bold gradient-gold-text">
                    {plan.amountLabel}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Get <span className="font-semibold text-foreground">{plan.worthLabel}</span> Worth Funeral Services
                  </p>
                </div>

                <Button asChild size="lg" variant={isGold ? 'default' : 'outline'} className="w-full rounded-xl">
                  <Link to="/apply">
                    Apply Now <ArrowRight className="ml-2 h-4 w-4" />
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
