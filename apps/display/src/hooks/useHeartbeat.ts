import { useState, useEffect, useRef } from 'react';
import { DISPLAY_HEARTBEAT_INTERVAL } from '@activacom/shared/constants';
import { sendHeartbeat } from '../lib/supabase';

interface UseHeartbeatOptions {
  onSessionExpired?: () => void;
}

export function useHeartbeat(
  sessionToken: string | null,
  opts?: UseHeartbeatOptions,
): { isConnected: boolean } {
  const [failureCount, setFailureCount] = useState(0);
  const onSessionExpiredRef = useRef(opts?.onSessionExpired);
  onSessionExpiredRef.current = opts?.onSessionExpired;

  useEffect(() => {
    if (!sessionToken) return;

    setFailureCount(0);

    const tick = async () => {
      try {
        await sendHeartbeat(sessionToken);
        setFailureCount(0);
      } catch {
        setFailureCount((prev) => {
          const next = prev + 1;
          if (next >= 3) {
            onSessionExpiredRef.current?.();
          }
          return next;
        });
      }
    };

    // Send first heartbeat immediately
    tick();

    const intervalId = setInterval(tick, DISPLAY_HEARTBEAT_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, [sessionToken]);

  return { isConnected: failureCount === 0 };
}
