import type { DisplaySession } from '@activacom/shared/types';
import { DEVICE_CODE_EXPIRY } from '@activacom/shared/constants';
import { supabase } from '@/lib/supabase';

export async function getDisplaySessions(eventId: string): Promise<DisplaySession[]> {
  const { data, error } = await supabase
    .from('display_sessions')
    .select('*')
    .eq('event_id', eventId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export interface GenerateDeviceCodeResult {
  id: string;
  device_code: string;
  expires_at: string;
}

export async function generateDeviceCode(eventId: string): Promise<GenerateDeviceCodeResult> {
  const deviceCode = Math.random().toString().slice(2, 8).padStart(6, '0');
  const expiresAt = new Date(Date.now() + DEVICE_CODE_EXPIRY).toISOString();

  const { data, error } = await supabase
    .from('display_sessions')
    .insert({
      event_id: eventId,
      device_code: deviceCode,
      session_token: `pending-${crypto.randomUUID()}`,
      is_active: false,
      expires_at: expiresAt,
    })
    .select('id, device_code, expires_at')
    .single();

  if (error) throw error;
  return data as GenerateDeviceCodeResult;
}

export async function revokeDisplaySession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('display_sessions')
    .update({ is_active: false })
    .eq('id', sessionId);

  if (error) throw error;
}
