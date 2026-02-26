import { FormBuilder } from '@/components/forms';
import type { CreateFormFieldInput } from '@activacom/shared/types';

interface StepFormFieldsProps {
  fields: CreateFormFieldInput[];
  onChange: (fields: CreateFormFieldInput[]) => void;
}

export function StepFormFields({ fields, onChange }: StepFormFieldsProps) {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Define los campos que los participantes llenaran al registrarse. Necesitas al menos un
        campo para poder activar el evento.
      </p>
      <FormBuilder mode="local" fields={fields} onChange={onChange} />
    </div>
  );
}
