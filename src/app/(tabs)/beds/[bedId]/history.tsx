import { getResponseError } from "@/src/api/axios";
import {
  ActionTask,
  getActionTaskSourceLabel,
  resolveActionTaskSourceType,
} from "@/src/api/queries/actionTasks/types";
import { useGetBedActionTasks } from "@/src/api/queries/actionTasks/useGetBedActionTasks";
import { Screen } from "@/src/components/Screen";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { MD3Theme, Text, useTheme } from "react-native-paper";

type HistoryStatusFilter = "all" | "done" | "canceled";
type HistorySourceFilter = "all" | "manual" | "automatyczne" | "sugestia";

const formatDate = (value?: string | null) => {
  if (!value) return "Brak";
  return value.split("T")[0];
};

const getTaskRecordDate = (task: ActionTask) =>
  task.doneAt ?? task.dueAt ?? task.createdAt ?? task.updatedAt ?? null;

const sortTaskHistoryDesc = (tasks: ActionTask[]) =>
  [...tasks].sort((a, b) => {
    const aDate = getTaskRecordDate(a) ?? "0000-01-01";
    const bDate = getTaskRecordDate(b) ?? "0000-01-01";
    return bDate.localeCompare(aDate);
  });

const getTaskStatusLabel = (status: ActionTask["status"]) => {
  if (status === "done") return "Wykonane";
  if (status === "canceled") return "Anulowane";
  return "Oczekujące";
};

const getTaskStatusTone = (status: ActionTask["status"]) => {
  if (status === "done") return "success" as const;
  if (status === "canceled") return "inactive" as const;
  return "warning" as const;
};

function buildPalette(dark: boolean) {
  return {
    background: dark ? "#141816" : "#F7F8F5",
    cardBg: dark ? "#1A1F1C" : "#FFFFFF",
    cardBorder: dark ? "#252D29" : "#E8ECE7",
    heading: dark ? "#F2F5F1" : "#1D2420",
    secondary: dark ? "#9AA59E" : "#6E7972",
    meta: dark ? "#7A8880" : "#97A29B",
    accent: dark ? "#7AB88A" : "#4A7C59",
    accentBg: dark ? "#1A2E1F" : "#EBF5EE",
    accentBorder: dark ? "#2A4A32" : "#C5DFC9",
    innerBg: dark ? "#161C19" : "#F3F6F2",
  };
}

export default function BedHistoryScreen() {
  const theme = useTheme<MD3Theme>();
  const palette = buildPalette(theme.dark);
  const styles = makeStyles(theme);
  const { bedId } = useLocalSearchParams<{ bedId?: string | string[] }>();
  const resolvedBedId = Array.isArray(bedId) ? bedId[0] : bedId;

  const [historyStatusFilter, setHistoryStatusFilter] =
    useState<HistoryStatusFilter>("all");
  const [historySourceFilter, setHistorySourceFilter] =
    useState<HistorySourceFilter>("all");

  const { data, isLoading, error } = useGetBedActionTasks(
    resolvedBedId ?? null,
    "all",
  );
  const allHistoryTasks = useMemo(
    () =>
      sortTaskHistoryDesc(
        (data?.items ?? []).filter(
          (task) => task.status === "done" || task.status === "canceled",
        ),
      ),
    [data?.items],
  );

  const historyTasks = useMemo(() => {
    const statusFiltered = allHistoryTasks.filter((task) => {
      if (historyStatusFilter === "all") return true;
      return task.status === historyStatusFilter;
    });

    return statusFiltered.filter((task) => {
      const sourceType = resolveActionTaskSourceType(task);
      if (historySourceFilter === "all") return true;
      if (historySourceFilter === "manual") return sourceType === "MANUAL";
      if (historySourceFilter === "automatyczne")
        return sourceType === "AUTOMATION";
      return sourceType === "SUGGESTION";
    });
  }, [allHistoryTasks, historySourceFilter, historyStatusFilter]);

  return (
    <Screen
      style={{ backgroundColor: palette.background }}
      safeAreaEdges={["left", "right"]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historia zabiegów</Text>

          <Text style={styles.filterLabel}>Status</Text>
          <View style={styles.filterChipsWrap}>
            {[
              { value: "all", label: "Wszystkie" },
              { value: "done", label: "Wykonane" },
              { value: "canceled", label: "Anulowane" },
            ].map((item) => {
              const isActive = historyStatusFilter === item.value;
              return (
                <Pressable
                  key={item.value}
                  onPress={() =>
                    setHistoryStatusFilter(item.value as HistoryStatusFilter)
                  }
                  style={[
                    styles.filterChip,
                    isActive ? styles.filterChipActive : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isActive ? styles.filterChipTextActive : null,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.filterLabel}>Typ</Text>
          <View style={styles.filterChipsWrap}>
            {[
              { value: "all", label: "Wszystkie" },
              { value: "manual", label: "Ręczne" },
              { value: "automatyczne", label: "Automatyczne" },
              { value: "sugestia", label: "Sugestia" },
            ].map((item) => {
              const isActive = historySourceFilter === item.value;
              return (
                <Pressable
                  key={item.value}
                  onPress={() =>
                    setHistorySourceFilter(item.value as HistorySourceFilter)
                  }
                  style={[
                    styles.filterChip,
                    isActive ? styles.filterChipActive : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isActive ? styles.filterChipTextActive : null,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {isLoading ? <Text style={styles.valueText}>Ładowanie…</Text> : null}
          {error ? (
            <Text style={styles.errorText}>
              {String(getResponseError(error))}
            </Text>
          ) : null}

          {!isLoading && !error && historyTasks.length === 0 ? (
            <Text style={styles.valueText}>Brak historii zabiegów.</Text>
          ) : null}

          {historyTasks.map((task) => (
            <View key={`history-${task.id}`} style={styles.historyRow}>
              <View style={styles.taskMain}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                {task.description ? (
                  <Text style={styles.taskDescription}>{task.description}</Text>
                ) : null}
                <Text style={styles.taskMeta}>
                  Data: {formatDate(getTaskRecordDate(task))}
                </Text>
                <Text style={styles.taskMeta}>
                  Źródło:{" "}
                  {getActionTaskSourceLabel(resolveActionTaskSourceType(task))}
                </Text>
              </View>
              <StatusBadge
                label={getTaskStatusLabel(task.status)}
                tone={getTaskStatusTone(task.status)}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (theme: MD3Theme) => {
  const palette = buildPalette(theme.dark);
  return StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 24,
      backgroundColor: palette.background,
    },
    section: {
      backgroundColor: palette.cardBg,
      borderColor: palette.cardBorder,
      borderWidth: 1,
      borderRadius: 22,
      padding: 20,
    },
    sectionTitle: {
      fontSize: 19,
      fontWeight: "700",
      color: palette.heading,
      marginBottom: 12,
    },
    filterLabel: {
      fontSize: 12,
      color: palette.meta,
      marginBottom: 6,
      marginTop: 4,
    },
    filterChipsWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 10,
    },
    filterChip: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: palette.cardBorder,
      backgroundColor: palette.innerBg,
    },
    filterChipActive: {
      borderColor: palette.accentBorder,
      backgroundColor: palette.accentBg,
    },
    filterChipText: {
      fontSize: 12,
      color: palette.secondary,
      fontWeight: "500",
    },
    filterChipTextActive: {
      color: palette.accent,
      fontWeight: "600",
    },
    valueText: {
      fontSize: 14,
      lineHeight: 20,
      color: palette.secondary,
      marginTop: 8,
    },
    errorText: {
      fontSize: 14,
      color: theme.colors.error,
      marginTop: 8,
    },
    historyRow: {
      borderTopWidth: 1,
      borderColor: palette.cardBorder,
      paddingVertical: 12,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 12,
    },
    taskMain: {
      gap: 4,
      flex: 1,
    },
    taskTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: palette.heading,
    },
    taskDescription: {
      fontSize: 13,
      color: palette.secondary,
    },
    taskMeta: {
      fontSize: 12,
      color: palette.meta,
    },
  });
};
