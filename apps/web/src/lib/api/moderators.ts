import type { InviteModeratorResponse } from '@activacom/shared/types';
import { supabase } from '@/lib/supabase';

export interface ModeratorRow {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export async function getModerators(tenantId: string): Promise<ModeratorRow[]> {
  const { data, error } = await supabase.rpc('get_tenant_moderators', {
    p_tenant_id: tenantId,
  });

  if (error) throw error;
  return (data ?? []) as ModeratorRow[];
}

export async function inviteModerator(email: string): Promise<InviteModeratorResponse> {
  const { data, error } = await supabase.functions.invoke('invite-moderator', {
    body: { email },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  return data as InviteModeratorResponse;
}

export async function deactivateModerator(userId: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ is_active: false })
    .eq('id', userId)
    .eq('role', 'moderator');

  if (error) throw error;
}

export async function reactivateModerator(userId: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ is_active: true })
    .eq('id', userId)
    .eq('role', 'moderator');

  if (error) throw error;
}
