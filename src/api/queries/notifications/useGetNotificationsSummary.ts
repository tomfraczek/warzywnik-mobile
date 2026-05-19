import { restClient } from "@/src/api/axios";
import { NotificationPriority } from "@/src/features/push/types";
import { useQuery } from "@tanstack/react-query";
import { NotificationsSummary } from "./types";

const PRIORITIES: NotificationPriority[] = [
  "LOW",
  "NORMAL",
  "HIGH",
  "CRITICAL",
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const asNumber = (value: unknown, fallback: number): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const asBoolean = (value: unknown, fallback: boolean): boolean =>
  typeof value === "boolean" ? value : fallback;

const asPriority = (value: unknown): NotificationPriority | null =>
  typeof value === "string" &&
  PRIORITIES.includes(value as NotificationPriority)
    ? (value as NotificationPriority)
    : null;

const normalizeSummary = (raw: unknown): NotificationsSummary => {
  const data = isRecord(raw) ? raw : {};
  const unreadCount = Math.max(0, asNumber(data.unreadCount, 0));
  const highestUnreadPriority = asPriority(data.highestUnreadPriority);

  return {
    unreadCount,
    hasUnread: asBoolean(data.hasUnread, unreadCount > 0),
    highestUnreadPriority,
    hasHighPriorityUnread: asBoolean(
      data.hasHighPriorityUnread,
      highestUnreadPriority === "HIGH" || highestUnreadPriority === "CRITICAL",
    ),
    hasCriticalUnread: asBoolean(
      data.hasCriticalUnread,
      highestUnreadPriority === "CRITICAL",
    ),
  };
};

const getNotificationsSummary = async (): Promise<NotificationsSummary> => {
  const { data } = await restClient.get<unknown>("/notifications/summary");
  return normalizeSummary(data);
};

export const useGetNotificationsSummary = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["notifications", "summary"],
    queryFn: getNotificationsSummary,
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 20,
  });
};
