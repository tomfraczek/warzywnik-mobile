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
export type PushRiskLevel = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type PushDeliveryPolicy =
  | "PUSH_IMMEDIATE"
  | "PUSH_DIGEST"
  | "CENTER_ONLY"
  | "PLAN_ONLY";

export type PushNotificationPayload = {
  notificationId: string;
  type: NotificationType;
  routeTarget: NotificationRouteTarget;
  priority: NotificationPriority;
  title: string;
  body: string;
  // Aggregated notifications (post-refactor)
  userIntentKey?: string;
  count?: number;
  deliveryPolicy?: PushDeliveryPolicy;
  // Multi-entity arrays
  actionTaskIds?: string[];
  bedIds?: string[];
  plantingIds?: string[];
  affectedPlantingIds?: string[];
  // Legacy single-entity fields (kept for backward compatibility)
  bedId?: string;
  plantingId?: string;
  ownerScopeType?: "USER" | "BED" | "PLANTING" | "SPACE" | "GROWING_SPACE";
  ownerScopeId?: string;
  relationType?:
    | "DIRECT"
    | "BED"
    | "SPACE"
    | "RELATED_FROM_BED"
    | "RELATED_FROM_SPACE"
    | "RELATED"
    | "AGGREGATED";
  growingSpaceId?: string;
  warningIds?: string[];
  riskLevel?: PushRiskLevel;
  riskReason?: string;
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
