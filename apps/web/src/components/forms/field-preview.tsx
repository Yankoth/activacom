import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { FieldType } from '@activacom/shared/types';

interface FieldPreviewProps {
  label: string;
  fieldType: FieldType;
  isRequired: boolean;
  options?: string[];
}

export function FieldPreview({ label, fieldType, isRequired, options }: FieldPreviewProps) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {isRequired && <span className="text-destructive ml-1">*</span>}
      </Label>
      {fieldType === 'textarea' ? (
        <Textarea disabled placeholder={label} />
      ) : fieldType === 'select' ? (
        <Select disabled>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seleccionar..." />
          </SelectTrigger>
          <SelectContent>
            {options?.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          disabled
          type={fieldType === 'email' ? 'email' : fieldType === 'phone' ? 'tel' : fieldType === 'number' ? 'number' : 'text'}
          placeholder={label}
        />
      )}
    </div>
  );
}
