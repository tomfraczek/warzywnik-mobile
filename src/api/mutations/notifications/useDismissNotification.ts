import { restClient } from "@/src/api/axios";
import { NotificationsListResponse } from "@/src/api/queries/notifications/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const dismissNotification = async (notificationId: string): Promise<void> => {
  await restClient.patch(`/v1/notifications/${notificationId}/dismiss`);
};

export const useDismissNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: dismissNotification,
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: ["notifications", "list"] });

      const previous = queryClient.getQueriesData<NotificationsListResponse>({
        queryKey: ["notifications", "list"],
      });

      previous.forEach(([queryKey]) => {
        queryClient.setQueryData<NotificationsListResponse>(
          queryKey,
          (current) => {
            if (!current) return current;
            const nextItems = current.items.filter(
              (item) => item.id !== notificationId,
            );
            const removedCount = current.items.length - nextItems.length;
            return {
              ...current,
              items: nextItems,
              total: Math.max(0, current.total - removedCount),
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
      await queryClient.invalidateQueries({
        queryKey: ["notifications", "list"],
      });
    },
  });
};
