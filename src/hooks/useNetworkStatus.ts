import { onlineManager } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export function useIsOffline(): boolean {
  const [isOnline, setIsOnline] = useState(() => onlineManager.isOnline());

  useEffect(() => {
    const current = onlineManager.isOnline();
    if (__DEV__) {
      console.log(`[onlineManager] mounted, isOnline=${String(current)}`);
    }
    setIsOnline(current);
    const unsubscribe = onlineManager.subscribe((online) => {
      if (__DEV__) {
        console.log(`[onlineManager] changed → isOnline=${String(online)}`);
      }
      setIsOnline(online);
    });
    return unsubscribe;
  }, []);

  return !isOnline;
}

export function useNetworkStatus() {
  const isOffline = useIsOffline();
  return { isOnline: !isOffline, isOffline };
}
