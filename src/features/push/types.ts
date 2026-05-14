export type NotificationType =
  | "TASKS_GENERATED"
  | "DAILY_TASKS_SUMMARY"
  | "WEATHER_STATUS_CHANGED"
  | "GARDEN_RISK_CHANGED"
  | "WEATHER_ALERTS_SUMMARY"
  | "ARTICLE_RECOMMENDED"
  | "LIFECYCLE_SUGGESTION"
  | "WEEKLY_DIGEST";

export type NotificationRouteTarget =
  | "HOME"
  | "BEDS_LIST"
  | "BED_DETAIL"
  | "PLANTING_DETAIL"
  | "PLANNER"
  | "PLANNER_TASKS"
  | "WEATHER"
  | "GARDEN_RISK"
  | "WEATHER_ALERTS"
  | "WEATHER_ALERT_DETAIL"
  | "ARTICLE_DETAIL"
  | "ARTICLES_LIST"
  | "NOTIFICATION_CENTER";

export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

export type PushNotificationPayload = {
  notificationId: string;
  type: NotificationType;
  routeTarget: NotificationRouteTarget;
  priority: NotificationPriority;
  title: string;
  body: string;
  bedId?: string;
  plantingId?: string;
  actionTaskIds?: string[];
  bedIds?: string[];
  plantingIds?: string[];
  warningIds?: string[];
  warningCode?: string;
  articleId?: string;
  articleSlug?: string;
  dedupeKey: string;
  createdAt: string;
};

export type ParsedPushNotificationPayload = {
  isValid: boolean;
  payload: PushNotificationPayload | null;
  reason?: string;
};
