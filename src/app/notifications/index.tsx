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
import { Card } from "@/src/components/ui/Card";
import { getPushNotificationRoute } from "@/src/features/push/getPushNotificationRoute";
import { spacing } from "@/src/theme/ui";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
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

const PRIORITY_LABEL: Record<NotificationItem["priority"], string> = {
  LOW: "Niski",
  NORMAL: "Normalny",
  HIGH: "Wysoki",
  CRITICAL: "Krytyczny",
};

const PRIORITY_COLOR = (
  priority: NotificationItem["priority"],
  theme: MD3Theme,
) => {
  if (priority === "CRITICAL") return theme.colors.error;
  if (priority === "HIGH") return "#AD7A00";
  if (priority === "NORMAL") return theme.colors.primary;
  return theme.colors.onSurfaceVariant;
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const USER_BODY_FALLBACK = "Sprawdź zalecenia dla ogrodu.";

export default function NotificationsScreen() {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const router = useRouter();
  const [status, setStatus] = useState<NotificationListFilter>("all");
  const [page, setPage] = useState(1);
  const [allItems, setAllItems] = useState<NotificationItem[]>([]);

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

  useEffect(() => {
    if (page === 1) {
      setAllItems(pageItems);
      return;
    }

    setAllItems((prev) => {
      const map = new Map<string, NotificationItem>();
      prev.forEach((item) => map.set(item.id, item));
      pageItems.forEach((item) => map.set(item.id, item));
      return Array.from(map.values());
    });
  }, [page, pageItems]);

  const unreadCount = useMemo(
    () => allItems.filter((item) => item.status === "unread").length,
    [allItems],
  );

  const updateItemAsReadLocally = (notificationId: string) => {
    const now = new Date().toISOString();
    setAllItems((prev) => {
      if (status === "unread") {
        return prev.filter((item) => item.id !== notificationId);
      }

      return prev.map((item) =>
        item.id === notificationId
          ? {
              ...item,
              status: "read",
              readAt: item.readAt ?? now,
            }
          : item,
      );
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
    try {
      await dismissNotification.mutateAsync(notificationId);
    } catch {
      Alert.alert("Powiadomienia", "Nie udało się ukryć powiadomienia.");
    }
  };

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
        <Card title="Powiadomienia" subtitle="Historia i akcje">
          <View style={styles.headerRow}>
            <Text style={styles.helperText}>Nieprzeczytane: {unreadCount}</Text>
            <Button
              mode="text"
              onPress={async () => {
                try {
                  if (status === "unread") {
                    setAllItems([]);
                  } else {
                    const now = new Date().toISOString();
                    setAllItems((prev) =>
                      prev.map((item) => ({
                        ...item,
                        status: "read",
                        readAt: item.readAt ?? now,
                      })),
                    );
                  }
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
              Oznacz wszystko jako przeczytane
            </Button>
          </View>

          <SegmentedButtons
            value={status}
            onValueChange={(value) => {
              setStatus(value as NotificationListFilter);
              setPage(1);
              setAllItems([]);
            }}
            buttons={FILTER_OPTIONS}
          />
        </Card>

        {notificationsQuery.isError ? (
          <Card>
            <Text style={styles.errorText}>
              Nie udało się pobrać powiadomień.
            </Text>
            <Button
              mode="outlined"
              onPress={() => void notificationsQuery.refetch()}
            >
              Spróbuj ponownie
            </Button>
          </Card>
        ) : null}

        {allItems.map((item) => (
          <TouchableRipple
            key={item.id}
            onPress={() => void handleOpen(item)}
            borderless
          >
            <View style={styles.notificationRow}>
              <View style={styles.notificationMain}>
                <View style={styles.titleRow}>
                  <Text style={styles.notificationTitle}>{item.title}</Text>
                  {item.status === "unread" ? (
                    <View style={styles.unreadDot} />
                  ) : null}
                </View>
                <Text style={styles.notificationBody}>
                  {item.body || USER_BODY_FALLBACK}
                </Text>
                <View style={styles.metaRow}>
                  <Text
                    style={[
                      styles.priority,
                      { color: PRIORITY_COLOR(item.priority, theme) },
                    ]}
                  >
                    {PRIORITY_LABEL[item.priority]}
                  </Text>
                  <Text style={styles.dateText}>
                    {formatDateTime(item.createdAt)}
                  </Text>
                </View>
              </View>

              <View style={styles.actionsCol}>
                {item.status === "unread" ? (
                  <Button
                    compact
                    mode="text"
                    onPress={() => {
                      void handleMarkRead(item);
                    }}
                    disabled={markRead.isPending}
                  >
                    Przeczytane
                  </Button>
                ) : null}
                <Button
                  compact
                  mode="text"
                  onPress={() => {
                    void handleDismiss(item.id);
                  }}
                  disabled={dismissNotification.isPending}
                >
                  Ukryj
                </Button>
              </View>
            </View>
          </TouchableRipple>
        ))}

        {allItems.length === 0 && !notificationsQuery.isLoading ? (
          <Card>
            <Text style={styles.helperText}>
              Brak powiadomień dla wybranego filtra.
            </Text>
          </Card>
        ) : null}

        {hasNextPage ? (
          <Button
            mode="outlined"
            onPress={() => setPage((value) => value + 1)}
            loading={notificationsQuery.isLoading}
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
      gap: spacing.md,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.sm,
      gap: spacing.sm,
    },
    helperText: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    errorText: {
      fontSize: 13,
      color: theme.colors.error,
      marginBottom: spacing.sm,
    },
    notificationRow: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
      padding: spacing.md,
      flexDirection: "row",
      gap: spacing.sm,
    },
    notificationMain: {
      flex: 1,
      gap: 6,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    notificationTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.colors.onSurface,
      flex: 1,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.primary,
    },
    notificationBody: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    metaRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 2,
    },
    priority: {
      fontSize: 12,
      fontWeight: "700",
    },
    dateText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    actionsCol: {
      alignItems: "flex-end",
      justifyContent: "center",
    },
  });
