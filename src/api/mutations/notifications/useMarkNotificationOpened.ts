import { restClient } from "@/src/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const markNotificationOpened = async (
  notificationId: string,
): Promise<void> => {
  await restClient.patch(`/v1/notifications/${notificationId}/opened`);
};

export const useMarkNotificationOpened = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationOpened,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["notifications", "list"],
      });
    },
  });
};
