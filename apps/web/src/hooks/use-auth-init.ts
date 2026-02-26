import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth-store';

export function useAuthInit() {
  const initialize = useAuthStore((s) => s.initialize);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const unsubscribe = initialize();
    return () => {
      unsubscribe();
      initialized.current = false;
    };
  }, [initialize]);
}
