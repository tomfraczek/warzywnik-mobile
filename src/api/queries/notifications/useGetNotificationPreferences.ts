import { restClient } from "@/src/api/axios";
import { useQuery } from "@tanstack/react-query";
import {
  NotificationPreferenceGroups,
  NotificationPreferences,
  NotificationPreferencesAdvanced,
  NotificationPreferencesIntensity,
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

const asIntensity = (value: unknown): NotificationPreferencesIntensity => {
  if (value === "IMPORTANT_ONLY") return "IMPORTANT_ONLY";
  if (value === "ONLY_IMPORTANT") return "IMPORTANT_ONLY";
  if (value === "ALL") return "ALL";
  return "BALANCED";
};

const normalizeGroups = (
  groupsRaw: unknown,
  fallbackSource: Record<string, unknown>,
): NotificationPreferenceGroups => {
  const groups = isRecord(groupsRaw) ? groupsRaw : {};
  return {
    tasksAndRemindersEnabled: asBoolean(
      groups.tasksAndRemindersEnabled,
      asBoolean(fallbackSource.tasksEnabled, true) ||
        asBoolean(fallbackSource.dailySummaryEnabled, true),
    ),
    weatherAndRiskEnabled: asBoolean(
      groups.weatherAndRiskEnabled,
      asBoolean(fallbackSource.weatherStatusEnabled, true) ||
        asBoolean(fallbackSource.gardenRiskEnabled, true) ||
        asBoolean(fallbackSource.weatherAlertsEnabled, true),
    ),
    articlesAndTipsEnabled: asBoolean(
      groups.articlesAndTipsEnabled,
      asBoolean(fallbackSource.recommendedArticlesEnabled, true) ||
        asBoolean(fallbackSource.lifecycleSuggestionsEnabled, true),
    ),
    summariesEnabled: asBoolean(
      groups.summariesEnabled,
      asBoolean(fallbackSource.weeklyDigestEnabled, true),
    ),
  };
};

const normalizeAdvanced = (
  advancedRaw: unknown,
  fallbackSource: Record<string, unknown>,
): NotificationPreferencesAdvanced => {
  const advanced = isRecord(advancedRaw) ? advancedRaw : {};
  return {
    tasksEnabled: asBoolean(
      advanced.tasksEnabled,
      asBoolean(fallbackSource.tasksEnabled, true),
    ),
    dailySummaryEnabled: asBoolean(
      advanced.dailySummaryEnabled,
      asBoolean(fallbackSource.dailySummaryEnabled, true),
    ),
    weatherStatusEnabled: asBoolean(
      advanced.weatherStatusEnabled,
      asBoolean(fallbackSource.weatherStatusEnabled, true),
    ),
    gardenRiskEnabled: asBoolean(
      advanced.gardenRiskEnabled,
      asBoolean(fallbackSource.gardenRiskEnabled, true),
    ),
    weatherAlertsEnabled: asBoolean(
      advanced.weatherAlertsEnabled,
      asBoolean(fallbackSource.weatherAlertsEnabled, true),
    ),
    recommendedArticlesEnabled: asBoolean(
      advanced.recommendedArticlesEnabled,
      asBoolean(fallbackSource.recommendedArticlesEnabled, true),
    ),
    lifecycleSuggestionsEnabled: asBoolean(
      advanced.lifecycleSuggestionsEnabled,
      asBoolean(fallbackSource.lifecycleSuggestionsEnabled, true),
    ),
    weeklyDigestEnabled: asBoolean(
      advanced.weeklyDigestEnabled,
      asBoolean(fallbackSource.weeklyDigestEnabled, true),
    ),
  };
};

const normalizePreferences = (raw: unknown): NotificationPreferences => {
  const data = isRecord(raw) ? raw : {};
  const ui = isRecord(data.ui) ? data.ui : {};
  return {
    notificationsEnabled: asBoolean(data.notificationsEnabled, true),
    groups: normalizeGroups(data.groups, data),
    advanced: normalizeAdvanced(data.advanced, data),
    ui,
    intensity: asIntensity(ui.intensity ?? data.intensity),
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
