import { useDismissNotification } from "@/src/api/mutations/notifications/useDismissNotification";
import { useMarkAllNotificationsRead } from "@/src/api/mutations/notifications/useMarkAllNotificationsRead";
import { useMarkNotificationOpened } from "@/src/api/mutations/notifications/useMarkNotificationOpened";
import { useMarkNotificationRead } from "@/src/api/mutations/notifications/useMarkNotificationRead";
import {
  NotificationItem,
  NotificationListFilter,
} from "@/src/api/queries/notifications/types";
import { useGetNotifications } from "@/src/api/queries/notifications/useGetNotifications";
import { Screen } from "@/src/components/Screen";
import CustomHeader from "@/src/components/navigation/CustomHeader";
import { getPushNotificationRoute } from "@/src/features/push/getPushNotificationRoute";
import { radius, spacing } from "@/src/theme/ui";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  Button,
  MD3Theme,
  SegmentedButtons,
  Text,
  TouchableRipple,
  useTheme,
} from "react-native-paper";

const FILTER_OPTIONS: { value: NotificationListFilter; label: string }[] = [
  { value: "unread", label: "Nieprzeczytane" },
  { value: "read", label: "Przeczytane" },
];

const PRIORITY_ACCENT = (
  priority: NotificationItem["priority"],
  theme: MD3Theme,
): string => {
  if (priority === "CRITICAL") return theme.colors.error;
  if (priority === "HIGH") return "#C17E00";
  if (priority === "NORMAL") return theme.colors.primary;
  return theme.colors.outline;
};

const PRIORITY_LABEL: Record<NotificationItem["priority"], string> = {
  LOW: "Niski",
  NORMAL: "Normalny",
  HIGH: "Wysoki",
  CRITICAL: "Krytyczny",
};

const PRIORITY_BADGE_BG = (
  priority: NotificationItem["priority"],
  theme: MD3Theme,
): string => {
  if (priority === "CRITICAL") return theme.colors.errorContainer;
  if (priority === "HIGH") return "#3A2800";
  if (priority === "NORMAL") return theme.colors.primaryContainer;
  return theme.colors.surfaceVariant;
};

const PRIORITY_BADGE_TEXT = (
  priority: NotificationItem["priority"],
  theme: MD3Theme,
): string => {
  if (priority === "CRITICAL") return theme.colors.onErrorContainer;
  if (priority === "HIGH") return "#FFCF6B";
  if (priority === "NORMAL") return theme.colors.onPrimaryContainer;
  return theme.colors.onSurfaceVariant;
};

const formatRelativeDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "przed chwilą";
  if (diffMin < 60) return `${diffMin} min temu`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} godz. temu`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "wczoraj";
  if (diffD < 7) return `${diffD} dni temu`;
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

export default function NotificationsScreen() {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const router = useRouter();
  const [status, setStatus] = useState<NotificationListFilter>("unread");
  const [page, setPage] = useState(1);
  const [itemsByFilter, setItemsByFilter] =
    useState<Partial<Record<NotificationListFilter, NotificationItem[]>>>();

  const notificationsQuery = useGetNotifications({
    status,
    page,
    limit: 20,
  });

  const markRead = useMarkNotificationRead();
  const markOpened = useMarkNotificationOpened();
  const markAllRead = useMarkAllNotificationsRead();
  const dismissNotification = useDismissNotification();

  const pageItems = useMemo(
    () => notificationsQuery.data?.items ?? [],
    [notificationsQuery.data?.items],
  );
  const hasNextPage = notificationsQuery.data?.hasNextPage === true;

  const allItems = useMemo(
    () => itemsByFilter?.[status] ?? [],
    [itemsByFilter, status],
  );

  useEffect(() => {
    if (notificationsQuery.isLoading) return;

    setItemsByFilter((prev) => {
      const existing = page === 1 ? [] : (prev?.[status] ?? []);
      const map = new Map<string, NotificationItem>();
      existing.forEach((item) => map.set(item.id, item));
      pageItems.forEach((item) => map.set(item.id, item));
      return { ...prev, [status]: Array.from(map.values()) };
    });
  }, [pageItems, status, page, notificationsQuery.isLoading]);

  const unreadCount = useMemo(
    () =>
      (itemsByFilter?.unread ?? []).filter((i) => i.status === "unread").length,
    [itemsByFilter?.unread],
  );

  const updateItemAsReadLocally = (notificationId: string) => {
    const now = new Date().toISOString();
    setItemsByFilter((prev) => {
      const items = prev?.[status] ?? [];
      if (status === "unread") {
        return {
          ...prev,
          [status]: items.filter((item) => item.id !== notificationId),
        };
      }
      return {
        ...prev,
        [status]: items.map((item) =>
          item.id === notificationId
            ? { ...item, status: "read" as const, readAt: item.readAt ?? now }
            : item,
        ),
      };
    });
  };

  const handleMarkRead = async (item: NotificationItem) => {
    updateItemAsReadLocally(item.id);

    try {
      await markRead.mutateAsync(item.id);
    } catch {
      void notificationsQuery.refetch();
      Alert.alert("Powiadomienia", "Nie udało się oznaczyć jako przeczytane.");
    }
  };

  const handleOpen = async (item: NotificationItem) => {
    try {
      if (item.status === "unread") {
        updateItemAsReadLocally(item.id);
        await markRead.mutateAsync(item.id);
      }

      await markOpened.mutateAsync(item.id);

      const route = getPushNotificationRoute(item.payload);
      router.push(route);
    } catch (error) {
      console.warn("Failed to open notification", error);
      void notificationsQuery.refetch();
      Alert.alert("Powiadomienia", "Nie udało się otworzyć powiadomienia.");
    }
  };

  const handleDismiss = async (notificationId: string) => {
    setItemsByFilter((prev) => ({
      ...prev,
      [status]: (prev?.[status] ?? []).filter(
        (item) => item.id !== notificationId,
      ),
    }));
    try {
      await dismissNotification.mutateAsync(notificationId);
    } catch {
      void notificationsQuery.refetch();
      Alert.alert("Powiadomienia", "Nie udało się ukryć powiadomienia.");
    }
  };

  const isLoadingInitially =
    notificationsQuery.isLoading && allItems.length === 0;

  return (
    <Screen safeAreaEdges={["left", "right", "bottom"]}>
      <CustomHeader title="Powiadomienia" showBack />
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={notificationsQuery.isRefetching}
            onRefresh={() => {
              void notificationsQuery.refetch();
            }}
          />
        }
      >
        {/* Filter + header */}
        <View style={styles.filterSection}>
          <SegmentedButtons
            value={status}
            onValueChange={(value) => {
              setStatus(value as NotificationListFilter);
              setPage(1);
            }}
            buttons={FILTER_OPTIONS}
          />
          {status === "unread" && unreadCount > 0 ? (
            <View style={styles.headerActions}>
              <Text style={styles.unreadCountText}>
                {unreadCount} nieprzeczytanych
              </Text>
              <Pressable
                onPress={async () => {
                  try {
                    setItemsByFilter((prev) => ({
                      ...prev,
                      unread: [],
                    }));
                    await markAllRead.mutateAsync();
                  } catch {
                    void notificationsQuery.refetch();
                    Alert.alert(
                      "Powiadomienia",
                      "Nie udało się oznaczyć wszystkich jako przeczytane.",
                    );
                  }
                }}
                disabled={markAllRead.isPending}
              >
                <Text style={styles.markAllReadText}>Oznacz wszystkie</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        {/* Error */}
        {notificationsQuery.isError ? (
          <View style={styles.emptyCard}>
            <Text style={styles.errorText}>
              Nie udało się pobrać powiadomień.
            </Text>
            <Button
              mode="outlined"
              onPress={() => void notificationsQuery.refetch()}
              style={{ marginTop: spacing.sm }}
            >
              Spróbuj ponownie
            </Button>
          </View>
        ) : null}

        {/* Notification list */}
        {allItems.map((item) => (
          <TouchableRipple
            key={item.id}
            onPress={() => void handleOpen(item)}
            borderless
            style={[styles.card, item.status === "unread" && styles.cardUnread]}
          >
            <View>
              {/* Accent bar */}
              <View
                style={[
                  styles.accentBar,
                  { backgroundColor: PRIORITY_ACCENT(item.priority, theme) },
                ]}
              />

              <View style={styles.cardContent}>
                {/* Title row */}
                <View style={styles.titleRow}>
                  <Text
                    style={[
                      styles.title,
                      item.status === "unread" && styles.titleUnread,
                    ]}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                  {item.status === "unread" ? (
                    <View style={styles.unreadDot} />
                  ) : null}
                </View>

                {/* Body */}
                {item.body ? (
                  <Text style={styles.body} numberOfLines={3}>
                    {item.body}
                  </Text>
                ) : null}

                {/* Footer */}
                <View style={styles.footer}>
                  <View style={styles.footerLeft}>
                    <View
                      style={[
                        styles.priorityBadge,
                        {
                          backgroundColor: PRIORITY_BADGE_BG(
                            item.priority,
                            theme,
                          ),
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.priorityBadgeText,
                          {
                            color: PRIORITY_BADGE_TEXT(item.priority, theme),
                          },
                        ]}
                      >
                        {PRIORITY_LABEL[item.priority]}
                      </Text>
                    </View>
                    <Text style={styles.dateText}>
                      {formatRelativeDate(item.createdAt)}
                    </Text>
                  </View>

                  <View style={styles.footerActions}>
                    {item.status === "unread" ? (
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation?.();
                          void handleMarkRead(item);
                        }}
                        disabled={markRead.isPending}
                        style={styles.actionButton}
                        hitSlop={8}
                      >
                        <Text style={styles.actionButtonText}>Przeczytane</Text>
                      </Pressable>
                    ) : null}
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation?.();
                        void handleDismiss(item.id);
                      }}
                      disabled={dismissNotification.isPending}
                      style={styles.actionButton}
                      hitSlop={8}
                    >
                      <Text
                        style={[
                          styles.actionButtonText,
                          styles.actionButtonDim,
                        ]}
                      >
                        Ukryj
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          </TouchableRipple>
        ))}

        {/* Empty state – only when not loading */}
        {allItems.length === 0 && !isLoadingInitially ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>
              {status === "unread"
                ? "Brak nieprzeczytanych"
                : "Brak przeczytanych powiadomień"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {status === "unread"
                ? "Wszystko przeczytane. Świetna robota!"
                : "Tu pojawią się przeczytane powiadomienia."}
            </Text>
          </View>
        ) : null}

        {/* Load more */}
        {hasNextPage ? (
          <Button
            mode="outlined"
            onPress={() => setPage((v) => v + 1)}
            loading={notificationsQuery.isFetching}
            style={styles.loadMoreButton}
          >
            Załaduj więcej
          </Button>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      padding: spacing.md,
      paddingBottom: spacing.xl,
      gap: spacing.sm,
    },

    /* Filter section */
    filterSection: {
      gap: spacing.xs,
      marginBottom: spacing.xs,
    },
    headerActions: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 2,
      marginTop: 4,
    },
    unreadCountText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    markAllReadText: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.colors.primary,
    },

    /* Notification card */
    card: {
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
      overflow: "hidden",
    },
    cardUnread: {
      backgroundColor: theme.colors.surfaceVariant,
      borderColor: theme.colors.outline,
    },
    accentBar: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
      borderTopLeftRadius: radius.md,
      borderBottomLeftRadius: radius.md,
    },
    cardContent: {
      paddingVertical: spacing.sm,
      paddingRight: spacing.sm,
      paddingLeft: spacing.sm + 3 + 8,
      gap: 6,
    },

    /* Title */
    titleRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
    },
    title: {
      flex: 1,
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.onSurfaceVariant,
      lineHeight: 20,
    },
    titleUnread: {
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.primary,
      marginTop: 6,
      flexShrink: 0,
    },

    /* Body */
    body: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 18,
    },

    /* Footer */
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 4,
      gap: spacing.sm,
    },
    footerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flex: 1,
    },
    priorityBadge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 99,
    },
    priorityBadgeText: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.2,
    },
    dateText: {
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
    },
    footerActions: {
      flexDirection: "row",
      gap: 4,
      alignItems: "center",
    },
    actionButton: {
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    actionButtonText: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.colors.primary,
    },
    actionButtonDim: {
      color: theme.colors.onSurfaceVariant,
    },

    /* Empty state */
    emptyCard: {
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
      padding: spacing.lg,
      alignItems: "center",
      gap: spacing.xs,
      marginTop: spacing.sm,
    },
    emptyIcon: {
      fontSize: 32,
      marginBottom: 4,
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.colors.onSurface,
      textAlign: "center",
    },
    emptySubtitle: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
    },
    errorText: {
      fontSize: 13,
      color: theme.colors.error,
      textAlign: "center",
    },

    loadMoreButton: {
      marginTop: spacing.xs,
    },
  });
