import { useState } from 'react';
import { GripVertical, Trash2, X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CreateFormFieldInput, FieldType, ContactFieldType } from '@activacom/shared/types';

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: 'Texto',
  email: 'Email',
  phone: 'Telefono',
  number: 'Numero',
  select: 'Seleccion',
  textarea: 'Texto largo',
};

interface FieldEditorProps {
  field: CreateFormFieldInput;
  onChange: (field: CreateFormFieldInput) => void;
  onRemove: () => void;
  disabled?: boolean;
}

export function FieldEditor({ field, onChange, onRemove, disabled }: FieldEditorProps) {
  const [newOption, setNewOption] = useState('');

  function updateField(updates: Partial<CreateFormFieldInput>) {
    onChange({ ...field, ...updates });
  }

  function handleTypeChange(type: FieldType) {
    const updates: Partial<CreateFormFieldInput> = { field_type: type };
    // Auto-detect contact fields
    if (type === 'email') {
      updates.is_contact_field = true;
      updates.contact_type = 'email';
    } else if (type === 'phone') {
      updates.is_contact_field = true;
      updates.contact_type = 'phone';
    } else if (!field.is_contact_field) {
      updates.contact_type = undefined;
    }
    if (type !== 'select') {
      updates.options = undefined;
    }
    updateField(updates);
  }

  function addOption() {
    if (!newOption.trim()) return;
    updateField({ options: [...(field.options ?? []), newOption.trim()] });
    setNewOption('');
  }

  function removeOption(index: number) {
    const opts = [...(field.options ?? [])];
    opts.splice(index, 1);
    updateField({ options: opts });
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <GripVertical className="text-muted-foreground size-4 shrink-0 cursor-grab" />
        <Input
          value={field.label}
          onChange={(e) => updateField({ label: e.target.value })}
          placeholder="Etiqueta del campo"
          disabled={disabled}
          className="flex-1"
        />
        <Select
          value={field.field_type}
          onValueChange={(v) => handleTypeChange(v as FieldType)}
          disabled={disabled}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(FIELD_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={disabled}
          className="text-destructive shrink-0"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <label className="flex items-center gap-1.5">
          <Checkbox
            checked={field.is_required}
            onCheckedChange={(c) => updateField({ is_required: c === true })}
            disabled={disabled}
          />
          Obligatorio
        </label>
        <label className="flex items-center gap-1.5">
          <Checkbox
            checked={field.is_contact_field}
            onCheckedChange={(c) => {
              updateField({
                is_contact_field: c === true,
                contact_type: c === true ? (field.contact_type ?? undefined) : undefined,
              });
            }}
            disabled={disabled}
          />
          Campo de contacto
        </label>
        {field.is_contact_field && (
          <Select
            value={field.contact_type ?? ''}
            onValueChange={(v) => updateField({ contact_type: v as ContactFieldType })}
            disabled={disabled}
          >
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Tipo..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="phone">Telefono</SelectItem>
              <SelectItem value="name">Nombre</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {field.field_type === 'select' && (
        <div className="space-y-2">
          <Label className="text-xs">Opciones</Label>
          <div className="flex flex-wrap gap-2">
            {field.options?.map((opt, i) => (
              <span key={i} className="bg-muted flex items-center gap-1 rounded-full px-2.5 py-1 text-xs">
                {opt}
                {!disabled && (
                  <button onClick={() => removeOption(i)}>
                    <X className="size-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
          {!disabled && (
            <div className="flex gap-2">
              <Input
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                placeholder="Nueva opcion"
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
              />
              <Button variant="outline" size="sm" onClick={addOption} type="button">
                <Plus className="mr-1 size-3" />
                Agregar
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
