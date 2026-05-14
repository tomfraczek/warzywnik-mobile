import { restClient } from "@/src/api/axios";
import {
  NotificationPreferences,
  UpdateNotificationPreferencesDto,
} from "@/src/api/queries/notifications/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const updateNotificationPreferences = async (
  payload: UpdateNotificationPreferencesDto,
): Promise<NotificationPreferences> => {
  const { data } = await restClient.patch<NotificationPreferences>(
    "/users/me/notification-preferences",
    payload,
  );
  return data;
};

export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: async (nextPreferences) => {
      queryClient.setQueryData(
        ["notifications", "preferences"],
        nextPreferences,
      );
      await queryClient.invalidateQueries({
        queryKey: ["notifications", "preferences"],
      });
    },
  });
};
