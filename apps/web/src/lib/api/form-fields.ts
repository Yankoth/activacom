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
