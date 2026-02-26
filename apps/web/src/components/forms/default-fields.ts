import type { CreateFormFieldInput } from '@activacom/shared/types';

export function getDefaultFormFields(): CreateFormFieldInput[] {
  return [
    {
      label: 'Nombre',
      field_type: 'text',
      is_required: true,
      is_contact_field: true,
      contact_type: 'name',
      sort_order: 0,
    },
    {
      label: 'Email',
      field_type: 'email',
      is_required: true,
      is_contact_field: true,
      contact_type: 'email',
      sort_order: 1,
    },
    {
      label: 'Telefono',
      field_type: 'phone',
      is_required: false,
      is_contact_field: true,
      contact_type: 'phone',
      sort_order: 2,
    },
  ];
}
