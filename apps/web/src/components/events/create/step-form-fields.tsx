import { Plus, Trash2, GripVertical, X } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import type { CreateFormFieldInput, FieldType, ContactFieldType } from '@activacom/shared/types';
import { useState } from 'react';

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: 'Texto',
  email: 'Email',
  phone: 'Telefono',
  number: 'Numero',
  select: 'Seleccion',
  textarea: 'Texto largo',
};

interface StepFormFieldsProps {
  fields: CreateFormFieldInput[];
  onChange: (fields: CreateFormFieldInput[]) => void;
}

export function StepFormFields({ fields, onChange }: StepFormFieldsProps) {
  function addField() {
    onChange([
      ...fields,
      {
        label: '',
        field_type: 'text',
        is_required: false,
        is_contact_field: false,
        sort_order: fields.length,
      },
    ]);
  }

  function updateField(index: number, updates: Partial<CreateFormFieldInput>) {
    onChange(fields.map((f, i) => (i === index ? { ...f, ...updates } : f)));
  }

  function removeField(index: number) {
    onChange(
      fields.filter((_, i) => i !== index).map((f, i) => ({ ...f, sort_order: i }))
    );
  }

  function handleTypeChange(index: number, type: FieldType) {
    const updates: Partial<CreateFormFieldInput> = { field_type: type };
    if (type === 'email') {
      updates.is_contact_field = true;
      updates.contact_type = 'email';
    } else if (type === 'phone') {
      updates.is_contact_field = true;
      updates.contact_type = 'phone';
    }
    if (type !== 'select') {
      updates.options = undefined;
    }
    updateField(index, updates);
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Define los campos que los participantes llenaran al registrarse. Necesitas al menos un
        campo para poder activar el evento.
      </p>

      <div className="space-y-3">
        {fields.map((field, index) => (
          <InlineFieldEditor
            key={index}
            field={field}
            onUpdate={(updates) => updateField(index, updates)}
            onTypeChange={(type) => handleTypeChange(index, type)}
            onRemove={() => removeField(index)}
          />
        ))}
      </div>

      <Separator />

      <Button variant="outline" onClick={addField} className="w-full" type="button">
        <Plus className="mr-2 size-4" />
        Agregar campo
      </Button>
    </div>
  );
}

function InlineFieldEditor({
  field,
  onUpdate,
  onTypeChange,
  onRemove,
}: {
  field: CreateFormFieldInput;
  onUpdate: (updates: Partial<CreateFormFieldInput>) => void;
  onTypeChange: (type: FieldType) => void;
  onRemove: () => void;
}) {
  const [newOption, setNewOption] = useState('');

  function addOption() {
    if (!newOption.trim()) return;
    onUpdate({ options: [...(field.options ?? []), newOption.trim()] });
    setNewOption('');
  }

  function removeOption(i: number) {
    const opts = [...(field.options ?? [])];
    opts.splice(i, 1);
    onUpdate({ options: opts });
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <GripVertical className="text-muted-foreground size-4 shrink-0" />
        <Input
          value={field.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          placeholder="Etiqueta del campo"
          className="flex-1"
        />
        <Select value={field.field_type} onValueChange={onTypeChange}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(FIELD_TYPE_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" onClick={onRemove} className="text-destructive shrink-0" type="button">
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <label className="flex items-center gap-1.5">
          <Checkbox
            checked={field.is_required}
            onCheckedChange={(c) => onUpdate({ is_required: c === true })}
          />
          Obligatorio
        </label>
        <label className="flex items-center gap-1.5">
          <Checkbox
            checked={field.is_contact_field}
            onCheckedChange={(c) =>
              onUpdate({
                is_contact_field: c === true,
                contact_type: c === true ? (field.contact_type ?? undefined) : undefined,
              })
            }
          />
          Campo de contacto
        </label>
        {field.is_contact_field && (
          <Select
            value={field.contact_type ?? ''}
            onValueChange={(v) => onUpdate({ contact_type: v as ContactFieldType })}
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
                <button type="button" onClick={() => removeOption(i)}>
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
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
        </div>
      )}
    </div>
  );
}
