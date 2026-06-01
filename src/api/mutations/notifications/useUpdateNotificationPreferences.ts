import { restClient } from "@/src/api/axios";
import {
  NotificationPreferences,
  UpdateNotificationPreferencesDto,
} from "@/src/api/queries/notifications/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const NOTIFICATION_PREFERENCES_KEY = ["notifications", "preferences"] as const;

const pickAllowedAdvancedPatch = (
  patch: UpdateNotificationPreferencesDto["advanced"],
) => {
  if (!patch) return undefined;

  const next: Record<string, boolean> = {};

  if (typeof patch.dailySummaryEnabled === "boolean") {
    next.dailySummaryEnabled = patch.dailySummaryEnabled;
  }
  if (typeof patch.lifecycleSuggestionsEnabled === "boolean") {
    next.lifecycleSuggestionsEnabled = patch.lifecycleSuggestionsEnabled;
  }
  if (typeof patch.weatherAlertsEnabled === "boolean") {
    next.weatherAlertsEnabled = patch.weatherAlertsEnabled;
  }
  if (typeof patch.gardenRiskEnabled === "boolean") {
    next.gardenRiskEnabled = patch.gardenRiskEnabled;
  }
  if (typeof patch.weatherStatusEnabled === "boolean") {
    next.weatherStatusEnabled = patch.weatherStatusEnabled;
  }
  if (typeof patch.recommendedArticlesEnabled === "boolean") {
    next.recommendedArticlesEnabled = patch.recommendedArticlesEnabled;
  }
  if (typeof patch.weeklyDigestEnabled === "boolean") {
    next.weeklyDigestEnabled = patch.weeklyDigestEnabled;
  }

  return Object.keys(next).length > 0 ? next : undefined;
};

export const normalizeUpdatePayload = (
  payload: UpdateNotificationPreferencesDto,
) => {
  const normalized: Record<string, unknown> = {};

  if (typeof payload.notificationsEnabled === "boolean") {
    normalized.notificationsEnabled = payload.notificationsEnabled;
  }

  const advancedPatch = pickAllowedAdvancedPatch(payload.advanced);
  if (advancedPatch) {
    normalized.advanced = advancedPatch;
  }

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

export const mergeOptimisticPreferences = (
  current: NotificationPreferences,
  patch: UpdateNotificationPreferencesDto,
): NotificationPreferences => {
  const next: NotificationPreferences = {
    ...current,
    advanced: {
      ...current.advanced,
    },
  };

  if (typeof patch.notificationsEnabled === "boolean") {
    next.notificationsEnabled = patch.notificationsEnabled;
  }

  const advancedPatch = pickAllowedAdvancedPatch(patch.advanced);
  if (advancedPatch) {
    next.advanced = {
      ...next.advanced,
      ...advancedPatch,
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
