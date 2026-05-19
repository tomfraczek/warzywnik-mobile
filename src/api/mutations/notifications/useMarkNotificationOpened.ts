import { restClient } from "@/src/api/axios";
import { NotificationsListResponse } from "@/src/api/queries/notifications/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const markNotificationOpened = async (
  notificationId: string,
): Promise<void> => {
  await restClient.patch(`/notifications/${notificationId}/opened`);
};

export const useMarkNotificationOpened = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationOpened,
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: ["notifications", "list"] });

      const previous = queryClient.getQueriesData<NotificationsListResponse>({
        queryKey: ["notifications", "list"],
      });

      const now = new Date().toISOString();

      previous.forEach(([queryKey]) => {
        queryClient.setQueryData<NotificationsListResponse>(
          queryKey,
          (current) => {
            if (!current) return current;

            return {
              ...current,
              items: current.items.map((item) =>
                item.id === notificationId
                  ? {
                      ...item,
                      openedAt: item.openedAt ?? now,
                    }
                  : item,
              ),
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
      ]);
    },
  });
};
