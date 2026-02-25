import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';

export function useAuthInit() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    const unsubscribe = initialize();
    return unsubscribe;
  }, [initialize]);
}
