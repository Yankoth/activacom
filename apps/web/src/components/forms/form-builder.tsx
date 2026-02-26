import { useState } from 'react';
import {
  Plus,
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
  Type,
  Mail,
  Phone,
  Hash,
  ListChecks,
  AlignLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  useFormFields,
  useCreateFormField,
  useUpdateFormField,
  useDeleteFormField,
  useReorderFormFields,
} from '@/hooks/use-form-fields';
import { FieldEditorDialog } from './field-editor-dialog';
import { FormRenderer } from './form-renderer';
import type { CreateFormFieldInput, FieldType } from '@activacom/shared/types';

// ── Type icon map ─────────────────────────────────────────────────────────────

const FIELD_TYPE_ICONS: Record<FieldType, React.ComponentType<{ className?: string }>> = {
  text: Type,
  email: Mail,
  phone: Phone,
  number: Hash,
  select: ListChecks,
  textarea: AlignLeft,
};

// ── Dual-mode props ───────────────────────────────────────────────────────────

interface FormBuilderPersistedProps {
  mode: 'persisted';
  eventId: string;
  disabled?: boolean;
}

interface FormBuilderLocalProps {
  mode: 'local';
  fields: CreateFormFieldInput[];
  onChange: (fields: CreateFormFieldInput[]) => void;
  disabled?: boolean;
}

type FormBuilderProps = FormBuilderPersistedProps | FormBuilderLocalProps;

// ── Component ─────────────────────────────────────────────────────────────────

export function FormBuilder(props: FormBuilderProps) {
  if (props.mode === 'persisted') {
    return <PersistedFormBuilder eventId={props.eventId} disabled={props.disabled} />;
  }
  return <LocalFormBuilder fields={props.fields} onChange={props.onChange} disabled={props.disabled} />;
}

// ── Persisted mode ────────────────────────────────────────────────────────────

function PersistedFormBuilder({ eventId, disabled }: { eventId: string; disabled?: boolean }) {
  const { data: savedFields, isLoading } = useFormFields(eventId);
  const createFieldMutation = useCreateFormField();
  const updateFieldMutation = useUpdateFormField();
  const deleteFieldMutation = useDeleteFormField();
  const reorderMutation = useReorderFormFields();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Convert saved fields to CreateFormFieldInput for display
  const fields: CreateFormFieldInput[] = (savedFields ?? []).map((f) => ({
    label: f.label,
    field_type: f.field_type,
    is_required: f.is_required,
    is_contact_field: f.is_contact_field,
    contact_type: f.contact_type ?? undefined,
    options: f.options ?? undefined,
    sort_order: f.sort_order,
  }));

  function handleAdd() {
    setEditingIndex(null);
    setDialogOpen(true);
  }

  function handleEdit(index: number) {
    setEditingIndex(index);
    setDialogOpen(true);
  }

  function handleSave(field: CreateFormFieldInput) {
    if (editingIndex !== null && savedFields) {
      // Update existing
      const id = savedFields[editingIndex].id;
      updateFieldMutation.mutate({
        id,
        eventId,
        input: {
          label: field.label,
          field_type: field.field_type,
          is_required: field.is_required,
          is_contact_field: field.is_contact_field,
          contact_type: field.contact_type ?? null,
          options: field.options ?? null,
        },
      });
    } else {
      // Create new
      createFieldMutation.mutate({
        eventId,
        field: {
          label: field.label,
          field_type: field.field_type,
          is_required: field.is_required ?? false,
          is_contact_field: field.is_contact_field ?? false,
          contact_type: field.contact_type ?? null,
          options: field.options ?? null,
          sort_order: fields.length,
        },
      });
    }
  }

  function handleDelete(index: number) {
    if (!savedFields) return;
    const id = savedFields[index].id;
    deleteFieldMutation.mutate({ id, eventId });
  }

  function handleMove(index: number, direction: 'up' | 'down') {
    if (!savedFields) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= savedFields.length) return;

    const fieldOrders = savedFields.map((f, i) => {
      let sort_order = i;
      if (i === index) sort_order = newIndex;
      else if (i === newIndex) sort_order = index;
      return { id: f.id, sort_order };
    });

    reorderMutation.mutate({ eventId, fieldOrders });
  }

  if (isLoading) {
    return <div className="text-muted-foreground py-4 text-sm">Cargando campos...</div>;
  }

  return (
    <>
      <FormBuilderLayout
        fields={fields}
        disabled={disabled}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onMove={handleMove}
      />
      <FieldEditorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        field={editingIndex !== null ? fields[editingIndex] : null}
        onSave={handleSave}
        onDelete={editingIndex !== null ? () => handleDelete(editingIndex) : undefined}
      />
    </>
  );
}

// ── Local mode ────────────────────────────────────────────────────────────────

function LocalFormBuilder({
  fields,
  onChange,
  disabled,
}: {
  fields: CreateFormFieldInput[];
  onChange: (fields: CreateFormFieldInput[]) => void;
  disabled?: boolean;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  function handleAdd() {
    setEditingIndex(null);
    setDialogOpen(true);
  }

  function handleEdit(index: number) {
    setEditingIndex(index);
    setDialogOpen(true);
  }

  function handleSave(field: CreateFormFieldInput) {
    if (editingIndex !== null) {
      // Update existing
      onChange(fields.map((f, i) => (i === editingIndex ? { ...field, sort_order: i } : f)));
    } else {
      // Add new
      onChange([...fields, { ...field, sort_order: fields.length }]);
    }
  }

  function handleDelete(index: number) {
    onChange(
      fields.filter((_, i) => i !== index).map((f, i) => ({ ...f, sort_order: i }))
    );
  }

  function handleMove(index: number, direction: 'up' | 'down') {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;
    const updated = [...fields];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    onChange(updated.map((f, i) => ({ ...f, sort_order: i })));
  }

  return (
    <>
      <FormBuilderLayout
        fields={fields}
        disabled={disabled}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onMove={handleMove}
      />
      <FieldEditorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        field={editingIndex !== null ? fields[editingIndex] : null}
        onSave={handleSave}
        onDelete={editingIndex !== null ? () => handleDelete(editingIndex) : undefined}
      />
    </>
  );
}

// ── Shared layout ─────────────────────────────────────────────────────────────

interface FormBuilderLayoutProps {
  fields: CreateFormFieldInput[];
  disabled?: boolean;
  onAdd: () => void;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
}

function FormBuilderLayout({
  fields,
  disabled,
  onAdd,
  onEdit,
  onDelete,
  onMove,
}: FormBuilderLayoutProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {fields.length} campo{fields.length !== 1 ? 's' : ''} definido{fields.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left: field list */}
        <div className="space-y-2">
          {fields.length === 0 && (
            <p className="text-muted-foreground py-4 text-center text-sm">
              No hay campos definidos. Agrega uno para comenzar.
            </p>
          )}
          {fields.map((field, index) => {
            const Icon = FIELD_TYPE_ICONS[field.field_type] ?? Type;
            return (
              <div
                key={index}
                className="flex items-center gap-2 rounded-lg border px-3 py-2"
              >
                <Icon className="text-muted-foreground size-4 shrink-0" />
                <span className="flex-1 truncate text-sm font-medium">{field.label || 'Sin etiqueta'}</span>
                {field.is_required && (
                  <Badge variant="secondary" className="shrink-0 text-xs">Obligatorio</Badge>
                )}
                {field.is_contact_field && field.contact_type && (
                  <Badge variant="outline" className="shrink-0 text-xs">
                    Contacto: {field.contact_type}
                  </Badge>
                )}
                {!disabled && (
                  <div className="flex shrink-0 items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => onMove(index, 'up')}
                      disabled={index === 0}
                      type="button"
                    >
                      <ChevronUp className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => onMove(index, 'down')}
                      disabled={index === fields.length - 1}
                      type="button"
                    >
                      <ChevronDown className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => onEdit(index)}
                      type="button"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive size-7"
                      onClick={() => onDelete(index)}
                      type="button"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}

          {!disabled && (
            <>
              <Separator />
              <Button variant="outline" onClick={onAdd} className="w-full" type="button">
                <Plus className="mr-2 size-4" />
                Agregar campo
              </Button>
            </>
          )}
        </div>

        {/* Right: live preview */}
        <div>
          <p className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">
            Vista previa
          </p>
          <FormRenderer fields={fields} />
        </div>
      </div>
    </div>
  );
}
