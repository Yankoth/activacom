import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import type { User, Tenant, UserRole } from '@activacom/shared/types';
import { supabase } from '@/lib/supabase';

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
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        set({ session, isLoading: true });
        get().loadUserData(session.user.id).finally(() => {
          set({ isLoading: false, isInitialized: true });
        });
      } else {
        set({ session: null, isLoading: false, isInitialized: true });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        set({ session });
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
      .single();

    if (error || !data) {
      get().clearAuth();
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
