import { getResponseError } from "@/src/api/axios";
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      staleTime: 1000 * 60 * 2,
      retry(failureCount, error) {
        if (failureCount >= 2) {
          getResponseError(error);
          return false;
        }
        return true;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 3000),
    },
  },
});
