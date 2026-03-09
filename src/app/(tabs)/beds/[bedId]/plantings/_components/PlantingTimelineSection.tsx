import type { TimelineItem } from "@/src/api/queries/plantings/learningTypes";
import { useGetPlantingTimeline } from "@/src/api/queries/plantings/useGetPlantingTimeline";
import {
  formatLocalDateTime,
  getTimelineItemPresentation,
} from "@/src/utils/learningMappers";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Button, Icon, MD3Theme, Surface, useTheme } from "react-native-paper";

// ─── Single timeline item row ─────────────────────────────────────────────────

type TimelineItemRowProps = {
  item: TimelineItem;
  isLast: boolean;
};

function TimelineItemRow({ item, isLast }: TimelineItemRowProps) {
  const theme = useTheme<MD3Theme>();
  const styles = rowStyles(theme);
  const presentation = getTimelineItemPresentation(item);

  const iconColor =
    presentation.iconColor === "danger"
      ? theme.colors.error
      : presentation.iconColor === "warning"
        ? "#8D6A1B"
        : theme.colors.primary;

  return (
    <View style={styles.row}>
      {/* Left: icon + connector line */}
      <View style={styles.iconColumn}>
        <View style={[styles.iconCircle, { borderColor: iconColor }]}>
          <Icon source={presentation.icon} size={16} color={iconColor} />
        </View>
        {!isLast ? <View style={styles.connector} /> : null}
      </View>

      {/* Right: content */}
      <View style={[styles.content, isLast ? styles.contentLast : null]}>
        <Text style={styles.title}>{presentation.title}</Text>
        {presentation.subtitle ? (
          <Text style={styles.subtitle}>{presentation.subtitle}</Text>
        ) : null}
        <Text style={styles.time}>{formatLocalDateTime(item.time)}</Text>
      </View>
    </View>
  );
}

const rowStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      gap: 10,
    },
    iconColumn: {
      alignItems: "center",
      width: 28,
    },
    iconCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 1.5,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.colors.surface,
    },
    connector: {
      flex: 1,
      width: 1.5,
      backgroundColor: theme.colors.outlineVariant,
      marginVertical: 2,
      minHeight: 8,
    },
    content: {
      flex: 1,
      paddingBottom: 14,
      gap: 2,
    },
    contentLast: {
      paddingBottom: 0,
    },
    title: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    subtitle: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    time: {
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
    },
  });

// ─── Timeline section ──────────────────────────────────────────────────────────

type Props = {
  plantingId: string;
};

export function PlantingTimelineSection({ plantingId }: Props) {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);

  const { data, isLoading, error, refetch } =
    useGetPlantingTimeline(plantingId);

  return (
    <Surface style={styles.section} elevation={0}>
      <Text style={styles.sectionTitle}>Historia sezonu</Text>

      {isLoading ? <ActivityIndicator style={styles.loader} /> : null}

      {error && !isLoading ? (
        <View>
          <Text style={styles.errorText}>
            Nie udało się załadować historii sezonu.
          </Text>
          <Button
            mode="outlined"
            onPress={() => refetch()}
            style={styles.retryBtn}
          >
            Spróbuj ponownie
          </Button>
        </View>
      ) : null}

      {!isLoading && !error && (data?.items ?? []).length === 0 ? (
        <Text style={styles.emptyText}>Brak historii sezonu.</Text>
      ) : null}

      {!isLoading && !error && (data?.items ?? []).length > 0 ? (
        <View style={styles.timeline}>
          {(data?.items ?? []).map((item, idx, arr) => (
            <TimelineItemRow
              key={`${item.type}-${item.time}-${idx}`}
              item={item}
              isLast={idx === arr.length - 1}
            />
          ))}
        </View>
      ) : null}
    </Surface>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    section: {
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: 12,
      padding: 12,
      backgroundColor: theme.colors.surface,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.colors.onSurface,
      marginBottom: 10,
    },
    loader: {
      marginVertical: 8,
    },
    errorText: {
      fontSize: 13,
      color: theme.colors.error,
      marginBottom: 6,
    },
    emptyText: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    retryBtn: {
      alignSelf: "flex-start",
    },
    timeline: {
      gap: 0,
    },
  });
