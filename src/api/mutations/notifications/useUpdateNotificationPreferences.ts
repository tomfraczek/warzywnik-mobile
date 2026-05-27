import { restClient } from "@/src/api/axios";
import {
  NotificationPreferences,
  UpdateNotificationPreferencesDto,
} from "@/src/api/queries/notifications/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const NOTIFICATION_PREFERENCES_KEY = ["notifications", "preferences"] as const;

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

const mergeOptimisticPreferences = (
  current: NotificationPreferences,
  patch: UpdateNotificationPreferencesDto,
): NotificationPreferences => {
  const next: NotificationPreferences = {
    ...current,
    groups: {
      ...current.groups,
    },
  };

  if (typeof patch.notificationsEnabled === "boolean") {
    next.notificationsEnabled = patch.notificationsEnabled;
  }

  if (patch.groups) {
    next.groups = {
      ...next.groups,
      ...patch.groups,
    };
  }

  if (typeof patch.notificationHour === "number") {
    next.notificationHour = Math.min(23, Math.max(0, patch.notificationHour));
  }

  return next;
};

export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateNotificationPreferences,
    onMutate: async (patch) => {
      await queryClient.cancelQueries({
        queryKey: NOTIFICATION_PREFERENCES_KEY,
      });

      const previous = queryClient.getQueryData<NotificationPreferences>(
        NOTIFICATION_PREFERENCES_KEY,
      );

      if (previous) {
        queryClient.setQueryData<NotificationPreferences>(
          NOTIFICATION_PREFERENCES_KEY,
          mergeOptimisticPreferences(previous, patch),
        );
      }

      return { previous };
    },
    onError: (_error, _patch, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          NOTIFICATION_PREFERENCES_KEY,
          context.previous,
        );
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: NOTIFICATION_PREFERENCES_KEY,
      });
    },
  });
};
