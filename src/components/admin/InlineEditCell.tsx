import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface InlineEditCellProps {
  value: string | null;
  field: 'phone_number' | 'district';
  userId: string;
  onUpdate: (userId: string, field: string, value: string) => void;
}

const InlineEditCell: React.FC<InlineEditCellProps> = ({ value, field, userId, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const validate = (): string | null => {
    if (field === 'phone_number') {
      const cleaned = editValue.replace(/\s/g, '');
      if (cleaned && (!/^\d+$/.test(cleaned) || cleaned.length < 10)) {
        return 'Phone must be at least 10 digits';
      }
    }
    if (field === 'district' && !editValue.trim()) {
      return 'District is required';
    }
    return null;
  };

  const save = async () => {
    const error = validate();
    if (error) {
      toast({ title: 'Validation Error', description: error, variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ [field]: editValue.trim() })
        .eq('user_id', userId);

      if (dbError) throw dbError;
      onUpdate(userId, field, editValue.trim());
      setEditing(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') save();
    if (e.key === 'Escape') {
      setEditValue(value || '');
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={save}
        onKeyDown={handleKeyDown}
        disabled={saving}
        className="h-7 text-xs w-24 border-primary/50 focus-visible:ring-primary/30"
        type={field === 'phone_number' ? 'tel' : 'text'}
      />
    );
  }

  return (
    <span
      onDoubleClick={() => {
        setEditValue(value || '');
        setEditing(true);
      }}
      className="cursor-pointer hover:bg-primary/5 px-1 py-0.5 rounded transition-colors"
      title="Double-click to edit"
    >
      {value || '—'}
    </span>
  );
};

export default InlineEditCell;
