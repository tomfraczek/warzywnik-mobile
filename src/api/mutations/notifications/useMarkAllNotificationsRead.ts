import { restClient } from "@/src/api/axios";
import { NotificationsListResponse } from "@/src/api/queries/notifications/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const markAllNotificationsRead = async (): Promise<void> => {
  await restClient.patch("/v1/notifications/read-all");
};

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
        queryClient.setQueryData<NotificationsListResponse>(
          queryKey,
          (current) => {
            if (!current) return current;
            return {
              ...current,
              items: current.items.map((item) => ({
                ...item,
                status: "read",
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
      await queryClient.invalidateQueries({
        queryKey: ["notifications", "list"],
      });
    },
  });
};
