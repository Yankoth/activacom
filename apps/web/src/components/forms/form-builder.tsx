import { useState, useEffect } from 'react';
import { Plus, Save, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useFormFields, useCreateFormFields, useDeleteFormField } from '@/hooks/use-form-fields';
import { FieldEditor } from './field-editor';
import { FieldPreview } from './field-preview';
import type { CreateFormFieldInput } from '@activacom/shared/types';

interface FormBuilderProps {
  eventId: string;
  disabled?: boolean;
}

export function FormBuilder({ eventId, disabled }: FormBuilderProps) {
  const { data: savedFields, isLoading } = useFormFields(eventId);
  const createFieldsMutation = useCreateFormFields();
  const deleteFieldMutation = useDeleteFormField();

  const [fields, setFields] = useState<CreateFormFieldInput[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (savedFields) {
      setFields(
        savedFields.map((f) => ({
          label: f.label,
          field_type: f.field_type,
          is_required: f.is_required,
          is_contact_field: f.is_contact_field,
          contact_type: f.contact_type ?? undefined,
          options: f.options ?? undefined,
          sort_order: f.sort_order,
        }))
      );
      setDirty(false);
    }
  }, [savedFields]);

  function addField() {
    setFields((prev) => [
      ...prev,
      {
        label: '',
        field_type: 'text',
        is_required: false,
        is_contact_field: false,
        sort_order: prev.length,
      },
    ]);
    setDirty(true);
  }

  function updateField(index: number, field: CreateFormFieldInput) {
    setFields((prev) => prev.map((f, i) => (i === index ? field : f)));
    setDirty(true);
  }

  function removeField(index: number) {
    const field = savedFields?.[index];
    if (field) {
      deleteFieldMutation.mutate({ id: field.id, eventId });
    }
    setFields((prev) => prev.filter((_, i) => i !== index).map((f, i) => ({ ...f, sort_order: i })));
    setDirty(true);
  }

  async function handleSave() {
    // Delete all existing fields then re-create to handle reordering
    if (savedFields) {
      for (const f of savedFields) {
        await deleteFieldMutation.mutateAsync({ id: f.id, eventId });
      }
    }
    const fieldsToCreate = fields
      .filter((f) => f.label.trim())
      .map((f, i) => ({ ...f, sort_order: i }));

    if (fieldsToCreate.length > 0) {
      createFieldsMutation.mutate({ eventId, fields: fieldsToCreate });
    }
    setDirty(false);
  }

  if (isLoading) {
    return <div className="text-muted-foreground py-4 text-sm">Cargando campos...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {fields.length} campo{fields.length !== 1 ? 's' : ''} definido{fields.length !== 1 ? 's' : ''}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            type="button"
          >
            <Eye className="mr-1 size-3" />
            {showPreview ? 'Editor' : 'Vista previa'}
          </Button>
          {!disabled && dirty && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={createFieldsMutation.isPending}
              type="button"
            >
              <Save className="mr-1 size-3" />
              {createFieldsMutation.isPending ? 'Guardando...' : 'Guardar campos'}
            </Button>
          )}
        </div>
      </div>

      {showPreview ? (
        <div className="rounded-lg border bg-white p-6 space-y-4 dark:bg-zinc-950">
          {fields.filter((f) => f.label.trim()).map((f, i) => (
            <FieldPreview
              key={i}
              label={f.label}
              fieldType={f.field_type}
              isRequired={f.is_required ?? false}
              options={f.options}
            />
          ))}
          {fields.filter((f) => f.label.trim()).length === 0 && (
            <p className="text-muted-foreground text-center text-sm">
              No hay campos para previsualizar
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <FieldEditor
              key={index}
              field={field}
              onChange={(f) => updateField(index, f)}
              onRemove={() => removeField(index)}
              disabled={disabled}
            />
          ))}
        </div>
      )}

      {!disabled && (
        <>
          <Separator />
          <Button variant="outline" onClick={addField} className="w-full" type="button">
            <Plus className="mr-2 size-4" />
            Agregar campo
          </Button>
        </>
      )}
    </div>
  );
}
