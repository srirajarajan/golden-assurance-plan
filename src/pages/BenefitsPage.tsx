import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/i18n/translations';
import {
  Phone,
  Sparkles,
  ShieldCheck,
  HeartHandshake,
  Wallet,
  IdCard,
  FileText,
  Camera,
  Users,
} from 'lucide-react';

const GUARANTEE_ICONS = [Phone, ShieldCheck, Sparkles, HeartHandshake, Wallet];
const DOC_ICONS = [IdCard, Camera, FileText];
const BULLET_ICONS = [Users, ShieldCheck, IdCard, Sparkles];

const BenefitsPage = () => {
  const { language } = useLanguage();
  const tp = translations[language].benefitsPage;

  return (
    <main className="min-h-screen bg-muted/30 py-12 md:py-16">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Heading */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-secondary mb-3">
            {tp.title}
          </h1>
          <div className="w-24 h-1 bg-primary mx-auto rounded-full" />
        </div>

        {/* Intro card */}
        <Card className="card-elevated p-6 md:p-8 mb-8 animate-slide-up">
          <p className="text-foreground/90 leading-relaxed mb-4">{tp.introHtml}</p>
          <ul className="space-y-3 text-foreground/85">
            {tp.bullets.map((b, i) => {
              const Icon = BULLET_ICONS[i] || Users;
              return (
                <li key={i} className="flex gap-3">
                  <Icon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* Service guarantee */}
        <h2 className="font-display text-2xl md:text-3xl font-bold text-secondary mb-6 text-center">
          {tp.guaranteeTitle}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          {tp.guarantees.map((g, i) => {
            const Icon = GUARANTEE_ICONS[i] || Phone;
            return (
              <Card
                key={i}
                className="card-elevated p-6 hover:shadow-glow hover:-translate-y-0.5 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <Icon size={22} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary mb-1">{g.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{g.desc}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Notes */}
        <Card className="card-elevated p-6 md:p-8 mb-10 bg-gradient-to-br from-primary/5 to-accent/10">
          <p className="text-foreground/90 leading-relaxed mb-3">{tp.noteCardOne}</p>
          <p className="text-foreground/90 leading-relaxed">{tp.noteCardTwo}</p>
        </Card>

        {/* Required Documents */}
        <h2 className="font-display text-2xl md:text-3xl font-bold text-secondary mb-6 text-center">
          {tp.docsTitle}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12">
          {tp.docs.map((d, i) => {
            const Icon = DOC_ICONS[i] || FileText;
            return (
              <Card
                key={i}
                className="card-elevated p-6 text-center hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                  <Icon size={26} />
                </div>
                <h4 className="font-semibold text-secondary">{d.label}</h4>
                <p className="text-sm text-primary font-medium mt-1">{d.qty}</p>
              </Card>
            );
          })}
        </div>

        {/* Administration */}
        <Card className="card-elevated p-6 md:p-8 bg-secondary text-secondary-foreground text-center">
          <h3 className="font-display text-xl md:text-2xl font-bold mb-2">{tp.adminTitle}</h3>
          <p>{tp.adminLine}</p>
          <p className="text-2xl font-bold mt-2 text-gold-light">96003 50699 / 96003 50889</p>
        </Card>
      </div>
    </main>
  );
};

export default BenefitsPage;
