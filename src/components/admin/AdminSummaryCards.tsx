import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, UserCheck, UserX, Hash } from 'lucide-react';

interface SummaryData {
  totalApplications: number;
  activeStaff: number;
  terminatedStaff: number;
  totalSerialsUsed: number;
}

interface AdminSummaryCardsProps {
  data: SummaryData;
  language: 'en' | 'ta';
}

const labels = {
  en: {
    totalApps: 'Total Applications',
    activeStaff: 'Active Staff',
    terminatedStaff: 'Terminated Staff',
    serialsUsed: 'Total Serials Used',
  },
  ta: {
    totalApps: 'மொத்த விண்ணப்பங்கள்',
    activeStaff: 'செயலில் உள்ள ஊழியர்கள்',
    terminatedStaff: 'நிறுத்தப்பட்ட ஊழியர்கள்',
    serialsUsed: 'பயன்படுத்திய சீரியல் எண்கள்',
  },
};

const AdminSummaryCards: React.FC<AdminSummaryCardsProps> = ({ data, language }) => {
  const t = labels[language];

  const cards = [
    { label: t.totalApps, value: data.totalApplications, icon: Hash, color: 'text-blue-600 bg-blue-100' },
    { label: t.activeStaff, value: data.activeStaff, icon: UserCheck, color: 'text-green-600 bg-green-100' },
    { label: t.terminatedStaff, value: data.terminatedStaff, icon: UserX, color: 'text-red-600 bg-red-100' },
    { label: t.serialsUsed, value: data.totalSerialsUsed, icon: Users, color: 'text-purple-600 bg-purple-100' },
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
