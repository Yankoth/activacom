import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FieldEditor } from './field-editor';
import type { CreateFormFieldInput } from '@activacom/shared/types';

interface FieldEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field: CreateFormFieldInput | null;
  onSave: (field: CreateFormFieldInput) => void;
  onDelete?: () => void;
}

const EMPTY_FIELD: CreateFormFieldInput = {
  label: '',
  field_type: 'text',
  is_required: false,
  is_contact_field: false,
  sort_order: 0,
};

export function FieldEditorDialog({
  open,
  onOpenChange,
  field,
  onSave,
  onDelete,
}: FieldEditorDialogProps) {
  const [draft, setDraft] = useState<CreateFormFieldInput>(EMPTY_FIELD);
  const isEditing = field !== null;

  useEffect(() => {
    if (open) {
      setDraft(field ?? { ...EMPTY_FIELD });
    }
  }, [open, field]);

  function handleSave() {
    if (!draft.label.trim()) return;
    onSave(draft);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar campo' : 'Agregar campo'}</DialogTitle>
        </DialogHeader>

        <FieldEditor field={draft} onChange={setDraft} />

        <DialogFooter className="flex-row gap-2 sm:justify-between">
          {isEditing && onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                onDelete();
                onOpenChange(false);
              }}
              className="mr-auto"
              type="button"
            >
              <Trash2 className="mr-1 size-3" />
              Eliminar
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!draft.label.trim()} type="button">
              {isEditing ? 'Guardar' : 'Agregar'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
