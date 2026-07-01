import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, UserCheck, Clock, Hash } from 'lucide-react';

interface SummaryData {
  totalApplications: number;
  completedApplications: number;
  pendingApplications: number;
  totalStaff: number;
}

interface AdminSummaryCardsProps {
  data: SummaryData;
  language: 'en' | 'ta';
}

const labels = {
  en: {
    totalApps: 'Total Applications',
    completedApps: 'Completed Applications',
    pendingApps: 'Pending Applications',
    totalStaff: 'Total Staff Members',
  },
  ta: {
    totalApps: 'மொத்த விண்ணப்பங்கள்',
    completedApps: 'நிறைவு பெற்ற விண்ணப்பங்கள்',
    pendingApps: 'நிலுவை விண்ணப்பங்கள்',
    totalStaff: 'மொத்த ஊழியர்கள்',
  },
};

const AdminSummaryCards: React.FC<AdminSummaryCardsProps> = ({ data, language }) => {
  const t = labels[language];

  const cards = [
    { label: t.totalApps, value: data.totalApplications, icon: Hash, color: 'text-blue-600 bg-blue-100' },
    { label: t.completedApps, value: data.completedApplications, icon: UserCheck, color: 'text-green-600 bg-green-100' },
    { label: t.pendingApps, value: data.pendingApplications, icon: Clock, color: 'text-amber-600 bg-amber-100' },
    { label: t.totalStaff, value: data.totalStaff, icon: Users, color: 'text-purple-600 bg-purple-100' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <Card key={card.label} className="shadow-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${card.color}`}>
              <card.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminSummaryCards;
