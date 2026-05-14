import { restClient } from "@/src/api/axios";
import { useQuery } from "@tanstack/react-query";
import {
  NotificationPreferences,
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

const normalizePreferences = (raw: unknown): NotificationPreferences => {
  const data = isRecord(raw) ? raw : {};
  return {
    notificationsEnabled: asBoolean(data.notificationsEnabled, true),
    tasksEnabled: asBoolean(data.tasksEnabled, true),
    dailySummaryEnabled: asBoolean(data.dailySummaryEnabled, true),
    weatherStatusEnabled: asBoolean(data.weatherStatusEnabled, true),
    gardenRiskEnabled: asBoolean(data.gardenRiskEnabled, true),
    weatherAlertsEnabled: asBoolean(data.weatherAlertsEnabled, true),
    recommendedArticlesEnabled: asBoolean(
      data.recommendedArticlesEnabled,
      true,
    ),
    lifecycleSuggestionsEnabled: asBoolean(
      data.lifecycleSuggestionsEnabled,
      true,
    ),
    weeklyDigestEnabled: asBoolean(data.weeklyDigestEnabled, true),
    intensity: asIntensity(data.intensity),
    notificationHour: Math.min(
      23,
      Math.max(0, asNumber(data.notificationHour, 8)),
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
