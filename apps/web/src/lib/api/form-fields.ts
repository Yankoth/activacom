import type { FormField, FormFieldInsert, FormFieldUpdate } from '@activacom/shared/types';
import { supabase } from '@/lib/supabase';

export async function getFormFields(eventId: string): Promise<FormField[]> {
  const { data, error } = await supabase
    .from('form_fields')
    .select('*')
    .eq('event_id', eventId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createFormFields(
  eventId: string,
  fields: Omit<FormFieldInsert, 'event_id' | 'id' | 'created_at'>[]
): Promise<FormField[]> {
  const rows = fields.map((f) => ({ ...f, event_id: eventId }));
  const { data, error } = await supabase
    .from('form_fields')
    .insert(rows)
    .select();

  if (error) throw error;
  return data ?? [];
}

export async function updateFormField(
  id: string,
  input: FormFieldUpdate
): Promise<FormField> {
  const { data, error } = await supabase
    .from('form_fields')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteFormField(id: string): Promise<void> {
  const { error } = await supabase.from('form_fields').delete().eq('id', id);
  if (error) throw error;
}

export async function createFormField(
  eventId: string,
  field: Omit<FormFieldInsert, 'event_id' | 'id' | 'created_at'>
): Promise<FormField> {
  const { data, error } = await supabase
    .from('form_fields')
    .insert({ ...field, event_id: eventId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function reorderFormFields(
  eventId: string,
  fieldOrders: { id: string; sort_order: number }[]
): Promise<void> {
  const promises = fieldOrders.map(({ id, sort_order }) =>
    supabase
      .from('form_fields')
      .update({ sort_order })
      .eq('id', id)
      .eq('event_id', eventId)
  );

  const results = await Promise.all(promises);
  const error = results.find((r) => r.error)?.error;
  if (error) throw error;
}
