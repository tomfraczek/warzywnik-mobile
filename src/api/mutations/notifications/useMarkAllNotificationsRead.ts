import { restClient } from "@/src/api/axios";
import { NotificationsListResponse } from "@/src/api/queries/notifications/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const markAllNotificationsRead = async (): Promise<void> => {
  await restClient.patch("/notifications/read-all");
};

const getStatusFromQueryKey = (queryKey: readonly unknown[]) =>
  queryKey[2] === "unread" || queryKey[2] === "read" || queryKey[2] === "all"
    ? queryKey[2]
    : "all";

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications", "list"] });

      const previous = queryClient.getQueriesData<NotificationsListResponse>({
        queryKey: ["notifications", "list"],
      });

      const now = new Date().toISOString();

      previous.forEach(([queryKey]) => {
        const queryStatus = getStatusFromQueryKey(queryKey);
        queryClient.setQueryData<NotificationsListResponse>(
          queryKey,
          (current) => {
            if (!current) return current;

            if (queryStatus === "unread") {
              return {
                ...current,
                items: [],
                total: 0,
              };
            }

            return {
              ...current,
              items: current.items.map((item) => ({
                ...item,
                status: "read" as const,
                readAt: item.readAt ?? now,
              })),
            };
          },
        );
      });

      return { previous };
    },
    onError: (_error, _variables, context) => {
      context?.previous.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["notifications", "list"],
          refetchType: "none",
        }),
        queryClient.invalidateQueries({
          queryKey: ["notifications", "summary"],
        }),
      ]);
    },
  });
};
