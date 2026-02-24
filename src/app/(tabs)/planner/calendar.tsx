import { getResponseError } from "@/src/api/axios";
import { useGetCalendar } from "@/src/api/queries/calendar/useGetCalendar";
import { Screen } from "@/src/components/Screen";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button, MD3Theme, Surface, useTheme } from "react-native-paper";

const pad2 = (n: number) => String(n).padStart(2, "0");

const formatDateOnly = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

export default function PlannerCalendarScreen() {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const router = useRouter();

  const range = useMemo(() => {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + 30);
    return {
      from: formatDateOnly(from),
      to: formatDateOnly(to),
    };
  }, []);

  const calendarQuery = useGetCalendar(range);
  const days = useMemo(
    () => calendarQuery.data?.days ?? [],
    [calendarQuery.data?.days],
  );

  if (calendarQuery.isLoading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </Screen>
    );
  }

  if (calendarQuery.error) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.errorText}>
            {String(getResponseError(calendarQuery.error))}
          </Text>
          <Button mode="outlined" onPress={() => calendarQuery.refetch()}>
            Spróbuj ponownie
          </Button>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Calendar</Text>
        <Text style={styles.subtitle}>
          Zakres: {range.from} → {range.to}
        </Text>

        {days.length === 0 ? (
          <Text style={styles.emptyText}>
            Brak wydarzeń w wybranym zakresie.
          </Text>
        ) : (
          days.map((day) => (
            <Surface key={day.date} style={styles.daySection} elevation={0}>
              <Text style={styles.dayTitle}>{day.date}</Text>

              {day.harvestWindows.length > 0 ? (
                <View style={styles.groupSection}>
                  <Text style={styles.groupTitle}>Harvest windows</Text>
                  {day.harvestWindows.map((windowItem) => (
                    <Pressable
                      key={`${windowItem.plantingId}-${windowItem.start}`}
                      style={styles.harvestItem}
                      onPress={() => {
                        if (!windowItem.plantingId) return;
                        router.push(`/plantings/${windowItem.plantingId}`);
                      }}
                    >
                      <Text style={styles.itemTitle}>{windowItem.title}</Text>
                      <Text style={styles.itemMeta}>
                        {windowItem.start} - {windowItem.end}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              {day.tasks.length > 0 ? (
                <View style={styles.groupSection}>
                  <Text style={styles.groupTitle}>Tasks</Text>
                  {day.tasks.map((task) => (
                    <Pressable
                      key={task.id}
                      style={styles.taskItem}
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
                    >
                      <Text style={styles.itemTitle}>{task.title}</Text>
                      <Text style={styles.itemMeta}>
                        Termin: {task.dueAt ?? day.date}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </Surface>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      padding: 24,
      paddingBottom: 32,
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.colors.onBackground,
    },
    subtitle: {
      marginTop: 6,
      marginBottom: 12,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    errorText: {
      fontSize: 14,
      color: theme.colors.error,
      marginBottom: 12,
      textAlign: "center",
    },
    daySection: {
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
      backgroundColor: theme.colors.surface,
      gap: 10,
    },
    dayTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    groupSection: {
      gap: 8,
    },
    groupTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.colors.onSurfaceVariant,
    },
    harvestItem: {
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.tertiary,
      backgroundColor: theme.colors.surfaceVariant,
      padding: 8,
      gap: 4,
    },
    taskItem: {
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
      padding: 8,
      gap: 4,
    },
    itemTitle: {
      fontSize: 14,
      color: theme.colors.onSurface,
      fontWeight: "600",
    },
    itemMeta: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    emptyText: {
      marginTop: 12,
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
  });
