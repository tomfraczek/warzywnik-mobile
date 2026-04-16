import { getResponseError } from "@/src/api/axios";
import {
  OfflineMutationError,
  isNetworkOnline,
} from "@/src/features/network/offline";
import NetInfo from "@react-native-community/netinfo";
import { QueryClient, onlineManager } from "@tanstack/react-query";

onlineManager.setEventListener((setOnline) => {
  const unsubscribe = NetInfo.addEventListener((state) => {
    const online = isNetworkOnline(state);
    if (__DEV__) {
      console.log(
        `[NetInfo] type=${state.type} isConnected=${String(state.isConnected)} isInternetReachable=${String(state.isInternetReachable)} → online=${String(online)}`,
      );
    }
    setOnline(online);
  });

  return unsubscribe;
});

void NetInfo.fetch().then((state) => {
  const online = isNetworkOnline(state);
  if (__DEV__) {
    console.log(
      `[NetInfo] initial: type=${state.type} isConnected=${String(state.isConnected)} isInternetReachable=${String(state.isInternetReachable)} → online=${String(online)}`,
    );
  }
  onlineManager.setOnline(online);
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 60 * 24,
      retry(failureCount, error) {
        if (onlineManager.isOnline() === false) {
          return false;
        }
        if (failureCount >= 2) {
          getResponseError(error);
          return false;
        }
        return true;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 3000),
    },
    mutations: {
      networkMode: "always",
      retry: false,
      onMutate: async () => {
        if (onlineManager.isOnline() === false) {
          throw new OfflineMutationError();
        }
      },
    },
  },
});
