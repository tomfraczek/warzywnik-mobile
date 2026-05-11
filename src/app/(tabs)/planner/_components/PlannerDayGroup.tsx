import { CalendarHarvestWindowItem } from "@/src/api/queries/calendar/types";
import { TaskItem } from "@/src/api/queries/users/meTypes";
import { spacing } from "@/src/theme/ui";
import { StyleSheet, View } from "react-native";
import { MD3Theme, Text, useTheme } from "react-native-paper";
import { PlannerHarvestCard } from "./PlannerHarvestCard";
import { PlannerTaskCard } from "./PlannerTaskCard";

type PlannerDayGroupProps = {
  title: string;
  tasks: TaskItem[];
  harvestEvents: CalendarHarvestWindowItem[];
  onTaskDone?: (task: TaskItem) => void;
  onTaskNavigate?: (task: TaskItem) => void;
  onHarvestNavigate?: (event: CalendarHarvestWindowItem) => void;
  disableTaskActions?: (task: TaskItem) => boolean;
};

export function PlannerDayGroup({
  title,
  tasks,
  harvestEvents,
  onTaskDone,
  onTaskNavigate,
  onHarvestNavigate,
  disableTaskActions,
}: PlannerDayGroupProps) {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {tasks.map((task) => (
        <PlannerTaskCard
          key={`task-${task.id}`}
          task={task}
          onDone={onTaskDone}
          onNavigate={onTaskNavigate}
          disableActions={disableTaskActions?.(task) ?? false}
        />
      ))}
      {harvestEvents.map((event) => (
        <PlannerHarvestCard
          key={`harvest-${event.plantingId}-${event.start}`}
          event={event}
          onPress={onHarvestNavigate}
        />
      ))}
    </View>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      gap: spacing.sm,
    },
    title: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.colors.onSurface,
      marginBottom: 2,
    },
  });
