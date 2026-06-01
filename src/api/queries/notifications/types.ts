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

export type NotificationsSummary = {
  unreadCount: number;
  hasUnread: boolean;
  highestUnreadPriority: NotificationPriority | null;
  hasHighPriorityUnread: boolean;
  hasCriticalUnread: boolean;
};

export type NotificationPreferencesAdvanced = {
  dailySummaryEnabled: boolean;
  lifecycleSuggestionsEnabled: boolean;
  weatherAlertsEnabled: boolean;
  gardenRiskEnabled: boolean;
  weatherStatusEnabled: boolean;
  recommendedArticlesEnabled: boolean;
  weeklyDigestEnabled: boolean;
};

export type NotificationPreferencesUi = Record<string, unknown>;

export type NotificationPreferences = {
  notificationsEnabled: boolean;
  advanced: NotificationPreferencesAdvanced;
  ui: NotificationPreferencesUi;
  notificationHour: number;
};

export type UpdateNotificationPreferencesDto = {
  notificationsEnabled?: boolean;
  advanced?: Partial<NotificationPreferencesAdvanced>;
  notificationHour?: number;
};
