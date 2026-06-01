import { restClient } from "@/src/api/axios";
import { useQuery } from "@tanstack/react-query";
import {
  NotificationPreferences,
  NotificationPreferencesAdvanced,
} from "./types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const asBoolean = (value: unknown, fallback = false): boolean =>
  typeof value === "boolean" ? value : fallback;

const asNumber = (value: unknown, fallback: number): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const normalizeAdvanced = (
  advancedRaw: unknown,
  fallbackSource: Record<string, unknown>,
): NotificationPreferencesAdvanced => {
  const advanced = isRecord(advancedRaw) ? advancedRaw : {};
  return {
    dailySummaryEnabled: asBoolean(
      advanced.dailySummaryEnabled,
      asBoolean(fallbackSource.dailySummaryEnabled, true),
    ),
    lifecycleSuggestionsEnabled: asBoolean(
      advanced.lifecycleSuggestionsEnabled,
      asBoolean(fallbackSource.lifecycleSuggestionsEnabled, true),
    ),
    weatherAlertsEnabled: asBoolean(
      advanced.weatherAlertsEnabled,
      asBoolean(fallbackSource.weatherAlertsEnabled, true),
    ),
    gardenRiskEnabled: asBoolean(
      advanced.gardenRiskEnabled,
      asBoolean(fallbackSource.gardenRiskEnabled, true),
    ),
    weatherStatusEnabled: asBoolean(
      advanced.weatherStatusEnabled,
      asBoolean(fallbackSource.weatherStatusEnabled, true),
    ),
    recommendedArticlesEnabled: asBoolean(
      advanced.recommendedArticlesEnabled,
      asBoolean(fallbackSource.recommendedArticlesEnabled, true),
    ),
    weeklyDigestEnabled: asBoolean(
      advanced.weeklyDigestEnabled,
      asBoolean(fallbackSource.weeklyDigestEnabled, true),
    ),
  };
};

export const normalizePreferences = (raw: unknown): NotificationPreferences => {
  const data = isRecord(raw) ? raw : {};
  const ui = isRecord(data.ui) ? data.ui : {};

  return {
    notificationsEnabled: asBoolean(data.notificationsEnabled, true),
    advanced: normalizeAdvanced(data.advanced, data),
    ui,
    notificationHour: Math.min(
      23,
      Math.max(0, asNumber(data.notificationHour ?? ui.notificationHour, 8)),
    ),
  };
};

const getNotificationPreferences =
  async (): Promise<NotificationPreferences> => {
    const { data } = await restClient.get<unknown>(
      "/users/me/notification-preferences",
    );
    return normalizePreferences(data);
  };

export const useGetNotificationPreferences = (options?: {
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: ["notifications", "preferences"],
    queryFn: getNotificationPreferences,
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 30,
  });
};
