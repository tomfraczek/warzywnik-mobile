import {
  NotificationPriority,
  NotificationRouteTarget,
  NotificationType,
  ParsedPushNotificationPayload,
  PushNotificationPayload,
} from "./types";

const NOTIFICATION_TYPES: NotificationType[] = [
  "TASKS_GENERATED",
  "DAILY_TASKS_SUMMARY",
  "WEATHER_STATUS_CHANGED",
  "GARDEN_RISK_CHANGED",
  "WEATHER_ALERTS_SUMMARY",
  "ARTICLE_RECOMMENDED",
  "LIFECYCLE_SUGGESTION",
  "WEEKLY_DIGEST",
];

const ROUTE_TARGETS: NotificationRouteTarget[] = [
  "HOME",
  "BEDS_LIST",
  "BED_DETAIL",
  "PLANTING_DETAIL",
  "PLANNER",
  "PLANNER_TASKS",
  "WEATHER",
  "GARDEN_RISK",
  "WEATHER_ALERTS",
  "WEATHER_ALERT_DETAIL",
  "ARTICLE_DETAIL",
  "ARTICLES_LIST",
  "NOTIFICATION_CENTER",
];

const PRIORITIES: NotificationPriority[] = [
  "LOW",
  "NORMAL",
  "HIGH",
  "CRITICAL",
];

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const readString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const readStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const cleaned = value
    .map((item) => readString(item))
    .filter((item): item is string => Boolean(item));
  return cleaned.length > 0 ? cleaned : undefined;
};

const readEnum = <T extends string>(
  value: unknown,
  allowedValues: readonly T[],
): T | undefined => {
  const asString = readString(value);
  if (!asString) return undefined;
  if (allowedValues.includes(asString as T)) {
    return asString as T;
  }
  return undefined;
};

export const parsePushNotificationPayload = (
  raw: unknown,
): ParsedPushNotificationPayload => {
  if (!isObjectRecord(raw)) {
    return {
      isValid: false,
      payload: null,
      reason: "Payload is not an object",
    };
  }

  const notificationId = readString(raw.notificationId);
  const type = readEnum(raw.type, NOTIFICATION_TYPES);
  const routeTarget = readEnum(raw.routeTarget, ROUTE_TARGETS);
  const priority = readEnum(raw.priority, PRIORITIES);
  const title = readString(raw.title);
  const body = readString(raw.body);
  const dedupeKey = readString(raw.dedupeKey);
  const createdAt = readString(raw.createdAt);

  if (
    !notificationId ||
    !type ||
    !routeTarget ||
    !priority ||
    !title ||
    !body ||
    !dedupeKey ||
    !createdAt
  ) {
    return {
      isValid: false,
      payload: null,
      reason: "Missing required fields",
    };
  }

  const payload: PushNotificationPayload = {
    notificationId,
    type,
    routeTarget,
    priority,
    title,
    body,
    bedId: readString(raw.bedId),
    plantingId: readString(raw.plantingId),
    actionTaskIds: readStringArray(raw.actionTaskIds),
    bedIds: readStringArray(raw.bedIds),
    plantingIds: readStringArray(raw.plantingIds),
    warningIds: readStringArray(raw.warningIds),
    warningCode: readString(raw.warningCode),
    articleId: readString(raw.articleId),
    articleSlug: readString(raw.articleSlug),
    dedupeKey,
    createdAt,
  };

  return {
    isValid: true,
    payload,
  };
};
