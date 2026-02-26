import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import type { User, Tenant, UserRole } from '@activacom/shared/types';
import { supabase } from '@/lib/supabase';

// Race guard: prevent concurrent tenant creation from multiple auth state changes
let _creatingTenant: Promise<void> | null = null;

interface AuthState {
  session: Session | null;
  user: User | null;
  tenant: Tenant | null;
  role: UserRole | null;
  isLoading: boolean;
  isInitialized: boolean;
}

interface AuthActions {
  initialize: () => () => void;
  loadUserData: (userId: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearAuth: () => void;
}

const initialState: AuthState = {
  session: null,
  user: null,
  tenant: null,
  role: null,
  isLoading: true,
  isInitialized: false,
};

export const useAuthStore = create<AuthState & AuthActions>()((set, get) => ({
  ...initialState,

  initialize: () => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        set({ session, isLoading: true });
        get().loadUserData(session.user.id).finally(() => {
          set({ isLoading: false, isInitialized: true });
        });
      } else {
        get().clearAuth();
        set({ isInitialized: true });
      }
    });

    return () => subscription.unsubscribe();
  },

  loadUserData: async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*, tenants(*)')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      // First login after email confirmation — tenant not yet created.
      // Check user_metadata for pending business info stored during signup.
      const session = get().session;
      const meta = session?.user?.user_metadata;

      if (meta?.business_name && meta?.business_slug && meta?.business_type) {
        // Race guard: if another call is already creating the tenant, wait for it
        if (_creatingTenant) {
          await _creatingTenant;
        } else {
          _creatingTenant = (async () => {
            const { error: rpcError } = await supabase.rpc('create_tenant_with_admin', {
              p_user_id: userId,
              p_tenant_name: meta.business_name,
              p_tenant_slug: meta.business_slug,
              p_tenant_type: meta.business_type,
            });

            if (rpcError) {
              console.error('[auth] create_tenant_with_admin failed:', rpcError);
              throw rpcError;
            }
          })();

          try {
            await _creatingTenant;
          } catch {
            _creatingTenant = null;
            get().clearAuth();
            return;
          }
          _creatingTenant = null;
        }

        // Retry loading after tenant creation
        const { data: retryData, error: retryError } = await supabase
          .from('users')
          .select('*, tenants(*)')
          .eq('id', userId)
          .single();

        if (retryError || !retryData) {
          console.error('[auth] Failed to load user after tenant creation:', retryError);
          get().clearAuth();
          return;
        }

        const tenant = (retryData as unknown as { tenants: Tenant }).tenants;
        set({
          user: {
            id: retryData.id,
            tenant_id: retryData.tenant_id,
            role: retryData.role,
            created_at: retryData.created_at,
            updated_at: retryData.updated_at,
          },
          tenant,
          role: retryData.role,
        });
        return;
      }

      console.error('[auth] No user row found and no business metadata:', error);
      await supabase.auth.signOut();
      return;
    }

    const tenant = (data as unknown as { tenants: Tenant }).tenants;

    set({
      user: {
        id: data.id,
        tenant_id: data.tenant_id,
        role: data.role,
        created_at: data.created_at,
        updated_at: data.updated_at,
      },
      tenant,
      role: data.role,
    });
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    get().clearAuth();
  },

  clearAuth: () => {
    set({
      session: null,
      user: null,
      tenant: null,
      role: null,
      isLoading: false,
    });
  },
}));
