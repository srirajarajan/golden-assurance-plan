import { Card } from '@/components/ui/card';
import { PLANS } from '@/data/plans';
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
  Star,
  Crown,
} from 'lucide-react';

const guarantees = [
  {
    icon: Phone,
    title: '24x7 Emergency Assistance',
    desc: 'We will arrive at your home with a single phone call, even at midnight or on holidays.',
  },
  {
    icon: ShieldCheck,
    title: 'Complete Service – A to Z',
    desc: 'We manage everything from death certificate arrangements to the final funeral ceremony.',
  },
  {
    icon: Sparkles,
    title: 'No Last-Minute Bargaining',
    desc: 'Families will not face embarrassing price negotiations during emotional moments. Everything is pre-planned.',
  },
  {
    icon: HeartHandshake,
    title: 'Religious & Family Ritual Support',
    desc: 'All required ritual items for Hindu, Christian, and Islamic traditions, including family customs, are available in one place.',
  },
  {
    icon: Wallet,
    title: 'No Financial Burden on Children',
    desc: 'Children and family members will not need to borrow money during emergencies.',
  },
];

const documents = [
  { icon: IdCard, label: 'Family Card Xerox', qty: '2 Copies' },
  { icon: Camera, label: 'Passport Size Photo', qty: '2 Nos.' },
  { icon: FileText, label: 'Aadhaar Card Xerox', qty: '2 Copies' },
];

const PLAN_ICONS = { silver: Star, gold: Sparkles, platinum: Crown } as const;

const BenefitsPage = () => {
  return (
    <main className="min-h-screen bg-muted/30 py-12 md:py-16">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Heading */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-secondary mb-3">
            William Carey Future Funeral Service Scheme
          </h1>
          <div className="w-24 h-1 bg-primary mx-auto rounded-full" />
        </div>

        {/* Intro card */}
        <Card className="card-elevated p-6 md:p-8 mb-8 animate-slide-up">
          <p className="text-foreground/90 leading-relaxed mb-4">
            <strong>“William Carey Future Funeral Service Scheme”</strong> has been
            introduced as a dignified and safe funeral service plan for poor,
            middle-class, and upper-class families.
          </p>
          <ul className="space-y-3 text-foreground/85">
            <li className="flex gap-3">
              <Users className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <span>This scheme can be used by a family member or an individual.</span>
            </li>
            <li className="flex gap-3">
              <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <span>To join this scheme, a member must be 40 years of age or above.</span>
            </li>
            <li className="flex gap-3">
              <IdCard className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <span>
                A nominee will be registered through the family card, and the service
                will be confirmed to the concerned person at the appropriate time.
              </span>
            </li>
            <li className="flex gap-3">
              <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <span>
                Every member joining this scheme will receive an official{' '}
                <strong>William Carey Funeral Service Scheme Membership Card</strong>{' '}
                sealed by the authorized officer.
              </span>
            </li>
          </ul>
        </Card>

        {/* Service guarantee */}
        <h2 className="font-display text-2xl md:text-3xl font-bold text-secondary mb-6 text-center">
          Additional Features – Our Service Guarantee
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          {guarantees.map((g, i) => (
            <Card
              key={i}
              className="card-elevated p-6 hover:shadow-glow hover:-translate-y-0.5 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <g.icon size={22} />
                </div>
                <div>
                  <h3 className="font-semibold text-secondary mb-1">{g.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{g.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Notes */}
        <Card className="card-elevated p-6 md:p-8 mb-10 bg-gradient-to-br from-primary/5 to-accent/10">
          <p className="text-foreground/90 leading-relaxed mb-3">
            When receiving services through this scheme, showing the official{' '}
            <strong>Service Card is mandatory</strong>.
          </p>
          <p className="text-foreground/90 leading-relaxed">
            Every beneficiary joining this scheme will receive sweets and savory snacks
            during the <strong>Diwali festival</strong> through{' '}
            <em>William Carey Funeral Services Pvt. Ltd.</em>
          </p>
        </Card>

        {/* Required Documents */}
        <h2 className="font-display text-2xl md:text-3xl font-bold text-secondary mb-6 text-center">
          Required Documents
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12">
          {documents.map((d, i) => (
            <Card
              key={i}
              className="card-elevated p-6 text-center hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                <d.icon size={26} />
              </div>
              <h4 className="font-semibold text-secondary">{d.label}</h4>
              <p className="text-sm text-primary font-medium mt-1">{d.qty}</p>
            </Card>
          ))}
        </div>

        {/* Fee table */}
        <h2 className="font-display text-2xl md:text-3xl font-bold text-secondary mb-2 text-center">
          Service Scheme Fee Details
        </h2>
        <p className="text-center text-muted-foreground mb-6">
          Transparent pricing across all our packages
        </p>

        <Card className="card-elevated overflow-hidden mb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm md:text-base">
              <thead>
                <tr className="bg-secondary text-secondary-foreground">
                  <th className="text-left p-3 md:p-4 font-semibold">Scheme Name</th>
                  <th className="text-right p-3 md:p-4 font-semibold">Document Fee</th>
                  <th className="text-right p-3 md:p-4 font-semibold">Service Fee</th>
                  <th className="text-right p-3 md:p-4 font-semibold">GST 18%</th>
                  <th className="text-right p-3 md:p-4 font-semibold">Total</th>
                  <th className="text-left p-3 md:p-4 font-semibold">Activation</th>
                  <th className="text-left p-3 md:p-4 font-semibold">Benefits</th>
                </tr>
              </thead>
              <tbody>
                {PLANS.map((p) => {
                  const Icon = PLAN_ICONS[p.id];
                  const isPlatinum = p.id === 'platinum';
                  return (
                    <tr
                      key={p.id}
                      className={
                        isPlatinum
                          ? 'bg-gradient-to-r from-accent/30 to-primary/10 font-medium'
                          : 'border-b'
                      }
                    >
                      <td className="p-3 md:p-4">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-primary" />
                          <span className="whitespace-nowrap">
                            {p.name} <span className="text-xs text-muted-foreground">({p.code})</span>
                          </span>
                        </div>
                      </td>
                      <td className="p-3 md:p-4 text-right">Rs. {p.documentFee.toLocaleString('en-IN')}</td>
                      <td className="p-3 md:p-4 text-right">Rs. {p.serviceFee.toLocaleString('en-IN')}</td>
                      <td className="p-3 md:p-4 text-right">Rs. {p.gst.toLocaleString('en-IN')}</td>
                      <td className="p-3 md:p-4 text-right font-bold text-primary">
                        Rs. {p.total.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 md:p-4 whitespace-nowrap">{p.activation}</td>
                      <td className="p-3 md:p-4 whitespace-nowrap">Rs. {p.worth.toLocaleString('en-IN')} Worth</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
        <p className="text-center text-sm italic text-muted-foreground mb-10">
          Plan Effective from Date of Registration
        </p>

        {/* Administration */}
        <Card className="card-elevated p-6 md:p-8 bg-secondary text-secondary-foreground text-center">
          <h3 className="font-display text-xl md:text-2xl font-bold mb-2">Administration</h3>
          <p>For more details, please contact us</p>
          <p className="text-2xl font-bold mt-2 text-gold-light">96003 50699 / 96003 50889</p>
        </Card>
      </div>
    </main>
  );
};

export default BenefitsPage;
