import { useState, useEffect } from 'react';
import type { DisplayState, DisplayEventState } from '@activacom/shared/types';
import { subscribeToEventState } from '../lib/supabase';

export function useDisplayState(eventId: string): {
  displayState: DisplayState;
  statePayload: DisplayEventState;
} {
  const [statePayload, setStatePayload] = useState<DisplayEventState>({
    display_state: 'PLACEHOLDER',
  });

  useEffect(() => {
    const unsubscribe = subscribeToEventState(eventId, (incoming) => {
      setStatePayload(incoming);
    });

    return unsubscribe;
  }, [eventId]);

  return {
    displayState: statePayload.display_state,
    statePayload,
  };
}
