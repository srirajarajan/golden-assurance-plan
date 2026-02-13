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
import { Loader2 } from 'lucide-react';

interface SerialRangeDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (rangeStart: number, rangeEnd: number) => Promise<void>;
  currentStart?: number | null;
  currentEnd?: number | null;
  currentSerial?: number;
  staffName?: string;
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
    belowUsage: 'Cannot set range below current usage',
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
    belowUsage: 'தற்போதைய பயன்பாட்டிற்கு கீழே வரம்பை அமைக்க முடியாது',
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
  language,
}) => {
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const t = labels[language];

  useEffect(() => {
    if (open) {
      setRangeStart(currentStart?.toString() || '');
      setRangeEnd(currentEnd?.toString() || '');
      setError('');
    }
  }, [open, currentStart, currentEnd]);

  const handleSave = async () => {
    const start = parseInt(rangeStart);
    const end = parseInt(rangeEnd);

    if (isNaN(start) || isNaN(end) || start >= end) {
      setError(t.invalidRange);
      return;
    }

    if (currentSerial > 0 && (start > currentSerial || end < currentSerial)) {
      setError(t.belowUsage);
      return;
    }

    setSaving(true);
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
