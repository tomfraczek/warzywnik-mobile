import { restClient } from "@/src/api/axios";
import { parsePushNotificationPayload } from "@/src/features/push/parsePushNotificationPayload";
import { useQuery } from "@tanstack/react-query";
import {
  NotificationItem,
  NotificationListFilter,
  NotificationsListResponse,
} from "./types";

type GetNotificationsParams = {
  status?: NotificationListFilter;
  page?: number;
  limit?: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const asString = (value: unknown, fallback = ""): string => {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

const asNumber = (value: unknown, fallback: number): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const asBoolean = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === "boolean") return value;
  return fallback;
};

const parseNotificationItem = (raw: unknown): NotificationItem | null => {
  if (!isRecord(raw)) return null;

  const id = asString(raw.id);
  if (!id) return null;

  const payloadRaw = isRecord(raw.payload) ? raw.payload : {};
  const topLevelCandidatePayload = {
    notificationId: id,
    type: asString(raw.type),
    routeTarget: asString(raw.routeTarget),
    priority: asString(raw.priority),
    title: asString(raw.title),
    body: asString(raw.body),
    dedupeKey: asString(raw.dedupeKey, `notification:${id}`),
    createdAt: asString(raw.createdAt, new Date().toISOString()),
    bedId: asString(raw.bedId) || undefined,
    plantingId: asString(raw.plantingId) || undefined,
    warningCode: asString(raw.warningCode) || undefined,
    articleId: asString(raw.articleId) || undefined,
    articleSlug: asString(raw.articleSlug) || undefined,
  };

  const payloadFromRaw = parsePushNotificationPayload(payloadRaw);
  const payloadFromTopLevel = parsePushNotificationPayload(
    topLevelCandidatePayload,
  );
  const payload = payloadFromRaw.payload ?? payloadFromTopLevel.payload;

  if (!payload) {
    console.warn("Notification item skipped because payload is invalid", {
      id,
    });
    return null;
  }

  return {
    id,
    title: asString(raw.title, payload.title),
    body: asString(raw.body, payload.body),
    type: payload.type,
    routeTarget: payload.routeTarget,
    priority: payload.priority,
    status: asString(raw.status, "unread") === "read" ? "read" : "unread",
    createdAt: asString(raw.createdAt, payload.createdAt),
    readAt: asString(raw.readAt) || null,
    openedAt: asString(raw.openedAt) || null,
    dismissedAt: asString(raw.dismissedAt) || null,
    payload,
  };
};

const getNotifications = async (
  params: GetNotificationsParams,
): Promise<NotificationsListResponse> => {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const status = params.status ?? "all";

  const { data } = await restClient.get<unknown>("/v1/notifications", {
    params: {
      status,
      page,
      limit,
    },
  });

  const response = isRecord(data) ? data : {};
  const rawItems = Array.isArray(response.items) ? response.items : [];
  const items = rawItems
    .map((item) => parseNotificationItem(item))
    .filter((item): item is NotificationItem => Boolean(item));

  const parsedPage = asNumber(response.page, page);
  const parsedLimit = asNumber(response.limit, limit);
  const total = asNumber(response.total, items.length);
  const hasNextPage = asBoolean(
    response.hasNextPage,
    parsedPage * parsedLimit < total,
  );

  return {
    items,
    page: parsedPage,
    limit: parsedLimit,
    total,
    hasNextPage,
  };
};

export const useGetNotifications = (
  params: GetNotificationsParams = {},
  options?: { enabled?: boolean },
) => {
  const status = params.status ?? "all";
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;

  return useQuery({
    queryKey: ["notifications", "list", status, page, limit],
    queryFn: () =>
      getNotifications({
        status,
        page,
        limit,
      }),
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 20,
  });
};
