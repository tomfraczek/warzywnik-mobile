import { getResponseError } from "@/src/api/axios";
import { useGetCalendar } from "@/src/api/queries/calendar/useGetCalendar";
import { Screen } from "@/src/components/Screen";
import { Card } from "@/src/components/ui/Card";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { TaskItem } from "@/src/components/ui/TaskItem";
import { radius, spacing } from "@/src/theme/ui";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { MD3Theme, Text, useTheme } from "react-native-paper";

const pad = (value: number) => String(value).padStart(2, "0");
const formatDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export default function PlannerScreen() {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const router = useRouter();

  const range = useMemo(() => {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + 30);
    return {
      from: formatDate(from),
      to: formatDate(to),
    };
  }, []);

  const calendarQuery = useGetCalendar(range);
  const timeline = useMemo(
    () => calendarQuery.data?.days ?? [],
    [calendarQuery.data?.days],
  );

  if (calendarQuery.isLoading) {
    return (
      <Screen safeAreaEdges={["top", "left", "right"]}>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </Screen>
    );
  }

  if (calendarQuery.error) {
    return (
      <Screen safeAreaEdges={["top", "left", "right"]}>
        <View style={styles.center}>
          <Text style={styles.errorText}>
            {String(getResponseError(calendarQuery.error))}
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen safeAreaEdges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Kalendarz zadań</Text>
        <Text style={styles.subtitle}>
          Dynamiczna oś czasu zadań systemowych i zbiorów
        </Text>

        {timeline.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>
              Brak zaplanowanych wydarzeń w najbliższych 30 dniach.
            </Text>
          </Card>
        ) : (
          timeline.map((day) => (
            <View key={day.date} style={styles.dayBlock}>
              <View style={styles.timelineHeader}>
                <View style={styles.timelineDot} />
                <Text style={styles.dayLabel}>{day.date}</Text>
              </View>

              <View style={styles.dayContent}>
                {day.tasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    title={task.title}
                    bed={
                      task.bedId ? `Grządka ${task.bedId.slice(0, 6)}` : null
                    }
                    crop={
                      task.plantingId
                        ? `Uprawa ${task.plantingId.slice(0, 6)}`
                        : null
                    }
                    status={task.dueAt ? "Zaplanowane" : "Do wykonania"}
                    iconName="clipboard-text-clock-outline"
                    onPress={() => {
                      if (task.plantingId) {
                        router.push(
                          `/plantings/${task.plantingId}?actionTaskId=${task.id}`,
                        );
                        return;
                      }
                      if (task.bedId) {
                        router.push(
                          `/(tabs)/beds/${task.bedId}?actionTaskId=${task.id}`,
                        );
                      }
                    }}
                  />
                ))}

                {day.harvestWindows.map((window) => (
                  <Pressable
                    key={`${window.plantingId}-${window.start}`}
                    style={styles.harvestCard}
                    onPress={() =>
                      router.push(`/plantings/${window.plantingId}`)
                    }
                  >
                    <View style={styles.harvestTop}>
                      <Text style={styles.harvestTitle}>{window.title}</Text>
                      <StatusBadge label="Zbiory" tone="success" />
                    </View>
                    <Text style={styles.harvestMeta}>
                      {window.start} → {window.end}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ))
        )}

        <Card>
          <View style={styles.footerHint}>
            <MaterialCommunityIcons
              name="robot-outline"
              size={18}
              color={theme.colors.onSurfaceVariant}
            />
            <Text style={styles.hintText}>
              Widok generowany automatycznie przez silnik planowania Warzywnik.
            </Text>
          </View>
        </Card>
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
    title: {
      fontSize: 26,
      fontWeight: "700",
      color: theme.colors.onBackground,
    },
    subtitle: {
      marginTop: spacing.xs,
      color: theme.colors.onSurfaceVariant,
      fontSize: 13,
    },
    dayBlock: {
      gap: spacing.sm,
    },
    timelineHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    timelineDot: {
      width: 10,
      height: 10,
      borderRadius: radius.pill,
      backgroundColor: theme.colors.primary,
    },
    dayLabel: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    dayContent: {
      marginLeft: 4,
      borderLeftWidth: 1,
      borderLeftColor: theme.colors.outlineVariant,
      paddingLeft: spacing.md,
      gap: spacing.sm,
    },
    harvestCard: {
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
      padding: spacing.sm,
      gap: spacing.xs,
    },
    harvestTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing.sm,
    },
    harvestTitle: {
      flex: 1,
      fontSize: 14,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    harvestMeta: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    footerHint: {
      flexDirection: "row",
      gap: spacing.sm,
      alignItems: "center",
    },
    hintText: {
      flex: 1,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: spacing.lg,
    },
    errorText: {
      color: theme.colors.error,
      textAlign: "center",
    },
    emptyText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
  });
