import { restClient } from "@/src/api/axios";
import { NotificationsListResponse } from "@/src/api/queries/notifications/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const markNotificationRead = async (notificationId: string): Promise<void> => {
  await restClient.patch(`/notifications/${notificationId}/read`);
};

const getStatusFromQueryKey = (queryKey: readonly unknown[]) =>
  queryKey[2] === "unread" || queryKey[2] === "read" || queryKey[2] === "all"
    ? queryKey[2]
    : "all";

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationRead,
    onMutate: async (notificationId) => {
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
            const nextItems =
              queryStatus === "unread"
                ? current.items.filter((item) => item.id !== notificationId)
                : current.items.map((item) =>
                    item.id === notificationId
                      ? {
                          ...item,
                          status: "read" as const,
                          readAt: item.readAt ?? now,
                        }
                      : item,
                  );

            return {
              ...current,
              items: nextItems,
              total:
                queryStatus === "unread"
                  ? Math.max(
                      0,
                      current.total - (current.items.length - nextItems.length),
                    )
                  : current.total,
            };
          },
        );
      });

      return { previous };
    },
    onError: (_error, _notificationId, context) => {
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
        queryClient.invalidateQueries({
          queryKey: ["notifications", "preferences"],
        }),
      ]);
    },
  });
};
