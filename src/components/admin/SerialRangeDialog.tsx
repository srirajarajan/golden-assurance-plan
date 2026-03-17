import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SerialRangeDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (rangeStart: number, rangeEnd: number) => Promise<void>;
  currentStart?: number | null;
  currentEnd?: number | null;
  currentSerial?: number;
  staffName?: string;
  staffUserId?: string;
  language: 'en' | 'ta';
}

const labels = {
  en: {
    title: 'Assign Serial Range',
    editTitle: 'Edit Serial Range',
    rangeStart: 'Range Start',
    rangeEnd: 'Range End',
    currentUsage: 'Current Serial Used',
    save: 'Save',
    cancel: 'Cancel',
    invalidRange: 'Start must be less than end',
    helperText: 'Admin can modify range anytime',
    overlapWarning: 'Warning: This range overlaps with another staff',
    belowUsageWarning: 'Warning: Range excludes current usage. Serial pointer will reset.',
  },
  ta: {
    title: 'சீரியல் வரம்பை ஒதுக்கு',
    editTitle: 'சீரியல் வரம்பை திருத்து',
    rangeStart: 'வரம்பு தொடக்கம்',
    rangeEnd: 'வரம்பு முடிவு',
    currentUsage: 'தற்போதைய பயன்பாடு',
    save: 'சேமி',
    cancel: 'ரத்து செய்',
    invalidRange: 'தொடக்கம் முடிவை விட குறைவாக இருக்க வேண்டும்',
    helperText: 'நிர்வாகி எந்த நேரத்திலும் வரம்பை மாற்றலாம்',
    overlapWarning: 'எச்சரிக்கை: இந்த வரம்பு வேறொரு ஊழியருடன் மேற்பொருந்துகிறது',
    belowUsageWarning: 'எச்சரிக்கை: வரம்பு தற்போதைய பயன்பாட்டை விலக்குகிறது. சீரியல் சுட்டி மீட்டமைக்கப்படும்.',
  },
};

const SerialRangeDialog: React.FC<SerialRangeDialogProps> = ({
  open,
  onClose,
  onSave,
  currentStart,
  currentEnd,
  currentSerial = 0,
  staffName,
  staffUserId,
  language,
}) => {
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const t = labels[language];

  useEffect(() => {
    if (open) {
      setRangeStart(currentStart?.toString() || '');
      setRangeEnd(currentEnd?.toString() || '');
      setError('');
      setWarnings([]);
    }
  }, [open, currentStart, currentEnd]);

  // Check for warnings (non-blocking) when values change
  useEffect(() => {
    const start = parseInt(rangeStart);
    const end = parseInt(rangeEnd);
    if (isNaN(start) || isNaN(end) || start >= end) {
      setWarnings([]);
      return;
    }

    const newWarnings: string[] = [];

    // Check if current serial is outside new range
    if (currentSerial > 0 && (start > currentSerial || end < currentSerial)) {
      newWarnings.push(t.belowUsageWarning);
    }

    // Check overlap asynchronously
    const checkOverlap = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('email')
        .neq('user_id', staffUserId || '')
        .not('range_start', 'is', null)
        .not('range_end', 'is', null)
        .lte('range_start', end)
        .gte('range_end', start);

      if (data && data.length > 0) {
        newWarnings.push(t.overlapWarning);
      }
      setWarnings(newWarnings);
    };

    if (staffUserId) {
      checkOverlap();
    } else {
      setWarnings(newWarnings);
    }
  }, [rangeStart, rangeEnd, currentSerial, staffUserId]);

  const handleSave = async () => {
    const start = parseInt(rangeStart);
    const end = parseInt(rangeEnd);

    if (isNaN(start) || isNaN(end) || start >= end) {
      setError(t.invalidRange);
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSave(start, end);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Error saving range');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {currentStart ? t.editTitle : t.title}
            {staffName && ` - ${staffName}`}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>{t.rangeStart}</Label>
            <Input
              type="number"
              value={rangeStart}
              onChange={(e) => setRangeStart(e.target.value)}
              placeholder="1"
              className="mt-1"
            />
          </div>
          <div>
            <Label>{t.rangeEnd}</Label>
            <Input
              type="number"
              value={rangeEnd}
              onChange={(e) => setRangeEnd(e.target.value)}
              placeholder="200"
              className="mt-1"
            />
          </div>
          {currentSerial > 0 && (
            <p className="text-sm text-muted-foreground">
              {t.currentUsage}: {currentSerial}
            </p>
          )}
          
          {/* Helper text */}
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Info className="h-3 w-3" />
            {t.helperText}
          </p>

          {/* Non-blocking warnings in orange */}
          {warnings.map((w, i) => (
            <p key={i} className="text-sm text-orange-600 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {w}
            </p>
          ))}

          {/* Critical errors in red */}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t.cancel}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SerialRangeDialog;
