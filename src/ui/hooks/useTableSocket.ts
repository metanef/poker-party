import { useEffect } from 'react';
import { LocalTableTransport } from '@/realtime/LocalTableTransport';
import { FirebaseTableTransport } from '@/realtime/FirebaseTableTransport';
import type { ITableTransport } from '@/realtime/ITableTransport';
import { useTableStore } from '@/store/tableStore';

let sharedTransport: ITableTransport | null = null;

/**
 * Chooses which transport backs the whole app. `LocalTableTransport` and
 * `FirebaseTableTransport` implement the exact same `ITableTransport`
 * interface, so no other UI code ever branches on which one is active.
 * Firebase is only used when its config is present; otherwise the app
 * falls back to local solo play against bots.
 */
export function getTransport(): ITableTransport {
  if (!sharedTransport) {
    const params = new URLSearchParams(window.location.search);
    const forceLocal = params.get('local') === 'true';
    const hasFirebaseConfig = Boolean(import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCHICjg1iz6-_c26JBPuq5i2q9aU7zdt7k');
    
    sharedTransport = (hasFirebaseConfig && !forceLocal)
      ? new FirebaseTableTransport()
      : new LocalTableTransport();
  }
  return sharedTransport;
}

/**
 * Mounts once near the app root: subscribes the active transport's public
 * table state, this player's private hand, and emote events into the
 * shared Zustand store. Components read from `useTableStore` selectors,
 * never from the transport directly.
 */
export function useTableSocket() {
  const transport = getTransport();
  const setTable = useTableStore((s) => s.setTable);
  const setPrivateHand = useTableStore((s) => s.setPrivateHand);
  const pushEmote = useTableStore((s) => s.pushEmote);

  useEffect(() => {
    const unsubTable = transport.subscribe(setTable);
    const unsubHand = transport.subscribePrivateHand(setPrivateHand);
    const unsubEmotes = transport.subscribeEmotes((event) =>
      pushEmote({
        id: `${event.playerId}-${event.at}-${Math.random().toString(36).slice(2, 6)}`,
        ...event,
      }),
    );
    return () => {
      unsubTable();
      unsubHand();
      unsubEmotes();
    };
  }, [transport, setTable, setPrivateHand, pushEmote]);

  return { transport, localPlayerId: transport.localPlayerId };
}
