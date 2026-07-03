import React from 'react';
import { Card } from '@/components/ui/card';
import { getPlanDetails } from '@/data/planDetails';
import { getPlanById, type PlanId } from '@/data/plans';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  planId: PlanId;
  /** Override the global language (e.g. to force `en` in admin views). */
  language?: 'en' | 'ta';
  className?: string;
}

/**
 * Bilingual Service Plan Details card. Automatically renders in the
 * currently selected language (via LanguageContext) unless a language
 * prop is provided. Uses the William Carey golden theme.
 */
const PlanDetailsCard: React.FC<Props> = ({ planId, language, className }) => {
  const ctx = useLanguage();
  const lang: 'en' | 'ta' = language ?? (ctx.language === 'ta' ? 'ta' : 'en');
  const plan = getPlanById(planId);
  const d = getPlanDetails(planId, lang);
  if (!plan) return null;

  return (
    <Card
      className={
        'border-2 border-primary/30 bg-gradient-to-b from-primary/5 to-background overflow-hidden ' +
        (className || '')
      }
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/15 to-primary/5 border-b border-primary/30 px-5 py-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-lg md:text-xl font-bold text-primary tracking-wide">
            {plan.code} PLAN
          </h3>
          <span className="text-sm font-semibold text-primary">{d.worthText}</span>
        </div>
        <p className="text-sm text-foreground/80 mt-1">{d.tagline}</p>
      </div>

      {/* Services table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-primary/10 text-primary">
              <th className="text-left px-3 py-2 font-semibold border-b border-primary/30 w-14">
                {d.colNo}
              </th>
              <th className="text-left px-3 py-2 font-semibold border-b border-primary/30 w-56">
                {d.colService}
              </th>
              <th className="text-left px-3 py-2 font-semibold border-b border-primary/30">
                {d.colDescription}
              </th>
            </tr>
          </thead>
          <tbody>
            {d.services.map((row) => (
              <tr key={row.no} className="odd:bg-background even:bg-primary/[0.03]">
                <td className="px-3 py-2 border-b border-primary/10 font-mono text-xs">{row.no}</td>
                <td className="px-3 py-2 border-b border-primary/10 font-medium">{row.service}</td>
                <td className="px-3 py-2 border-b border-primary/10 text-foreground/85">
                  {row.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Memorial + Notes */}
      <div className="p-5 space-y-3">
        <div className="inline-flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-1.5 text-sm font-semibold text-primary">
          {d.memorial}
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">
            {d.noteTitle}
          </div>
          <ul className="list-disc pl-5 space-y-1 text-sm text-foreground/85">
            {d.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
};

export default PlanDetailsCard;