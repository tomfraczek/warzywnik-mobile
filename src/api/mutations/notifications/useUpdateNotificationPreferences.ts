import { restClient } from "@/src/api/axios";
import { UpdateNotificationPreferencesDto } from "@/src/api/queries/notifications/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const normalizeUpdatePayload = (payload: UpdateNotificationPreferencesDto) => {
  const normalized: Record<string, unknown> = { ...payload };

  if (typeof payload.notificationHour === "number") {
    const normalizedHour = Math.min(23, Math.max(0, payload.notificationHour));
    normalized.notificationHour = normalizedHour;
  }

  return normalized;
};

const updateNotificationPreferences = async (
  payload: UpdateNotificationPreferencesDto,
): Promise<void> => {
  await restClient.patch(
    "/users/me/notification-preferences",
    normalizeUpdatePayload(payload),
  );
};

export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["notifications", "preferences"],
      });
    },
  });
};
