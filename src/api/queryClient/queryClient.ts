import { getResponseError } from "@/src/api/axios";
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry(failureCount, error) {
        if (failureCount === 5) {
          getResponseError(error);
        }
        return failureCount < 5;
      },
    },
  },
});
