import {
  NotificationPriority,
  NotificationRouteTarget,
  NotificationType,
  PushNotificationPayload,
} from "@/src/features/push/types";

export type NotificationStatus = "unread" | "read";
export type NotificationListFilter = "all" | "unread" | "read";

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  routeTarget: NotificationRouteTarget;
  priority: NotificationPriority;
  status: NotificationStatus;
  createdAt: string;
  readAt?: string | null;
  openedAt?: string | null;
  dismissedAt?: string | null;
  payload: PushNotificationPayload;
};

export type NotificationsListResponse = {
  items: NotificationItem[];
  page: number;
  limit: number;
  total: number;
  hasNextPage: boolean;
};

export type NotificationPreferencesIntensity =
  | "IMPORTANT_ONLY"
  | "BALANCED"
  | "ALL";

export type NotificationPreferences = {
  notificationsEnabled: boolean;
  tasksEnabled: boolean;
  dailySummaryEnabled: boolean;
  weatherStatusEnabled: boolean;
  gardenRiskEnabled: boolean;
  weatherAlertsEnabled: boolean;
  recommendedArticlesEnabled: boolean;
  lifecycleSuggestionsEnabled: boolean;
  weeklyDigestEnabled: boolean;
  intensity: NotificationPreferencesIntensity;
  notificationHour: number;
};

export type UpdateNotificationPreferencesDto = Partial<NotificationPreferences>;
