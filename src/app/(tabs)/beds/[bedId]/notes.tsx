import { getResponseError } from "@/src/api/axios";
import { useGetBedQuickActionNotes } from "@/src/api/queries/quickActions/useGetBedQuickActionNotes";
import { Screen } from "@/src/components/Screen";
import { usePremium } from "@/src/context/PremiumContext";
import { useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button, Icon, MD3Theme, Text, useTheme } from "react-native-paper";

const formatNoteDateTime = (value?: string | null) => {
  if (!value) return "Brak daty";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Brak daty";
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
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
  };
}

export default function BedNotesScreen() {
  const theme = useTheme<MD3Theme>();
  const palette = buildPalette(theme.dark);
  const styles = makeStyles(theme);
  const { bedId } = useLocalSearchParams<{ bedId?: string | string[] }>();
  const resolvedBedId = Array.isArray(bedId) ? bedId[0] : bedId;

  const { openPremiumPaywall } = usePremium();
  const notesQuery = useGetBedQuickActionNotes(resolvedBedId ?? null);
  const notes = notesQuery.data?.items ?? [];
  const hasLockedNotes = notes.some((n) => n.accessStatus === "locked");

  return (
    <Screen
      style={{ backgroundColor: palette.background }}
      safeAreaEdges={["left", "right"]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notatki</Text>

          {notesQuery.isLoading ? (
            <Text style={styles.valueText}>Ładowanie…</Text>
          ) : null}

          {notesQuery.error ? (
            <View>
              <Text style={styles.errorText}>
                {String(getResponseError(notesQuery.error))}
              </Text>
              <Button mode="outlined" onPress={() => notesQuery.refetch()}>
                Spróbuj ponownie
              </Button>
            </View>
          ) : null}

          {!notesQuery.isLoading && !notesQuery.error && notes.length === 0 ? (
            <Text style={styles.valueText}>Brak notatek.</Text>
          ) : null}

          {hasLockedNotes ? (
            <View style={styles.lockedBanner}>
              <Icon source="lock-outline" size={14} color={palette.secondary} />
              <Text style={styles.lockedBannerText}>
                Te dane nadal są zapisane na Twoim koncie. Odblokujesz je po aktywacji Premium.
              </Text>
            </View>
          ) : null}

          {notes.map((note) => {
            const isLocked = note.accessStatus === "locked";
            return isLocked ? (
              <Pressable
                key={note.id}
                style={[styles.timelineRow, styles.timelineRowLocked]}
                onPress={() => openPremiumPaywall({ reason: "lockedNote" })}
              >
                <Icon source="lock-outline" size={14} color={palette.secondary} />
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineDate, { opacity: 0.6 }]}>
                    {formatNoteDateTime(note.occurredAt ?? note.createdAt)}
                  </Text>
                  <Text style={[styles.timelineText, { opacity: 0.5 }]}>{note.note}</Text>
                </View>
              </Pressable>
            ) : (
              <View key={note.id} style={styles.timelineRow}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineDate}>
                    {formatNoteDateTime(note.occurredAt ?? note.createdAt)}
                  </Text>
                  <Text style={styles.timelineText}>{note.note}</Text>
                </View>
              </View>
            );
          })}
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
      marginBottom: 8,
    },
    valueText: {
      fontSize: 14,
      lineHeight: 20,
      color: palette.secondary,
    },
    errorText: {
      fontSize: 14,
      color: theme.colors.error,
      marginBottom: 10,
    },
    timelineRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      borderTopWidth: 1,
      borderTopColor: palette.cardBorder,
      paddingVertical: 12,
    },
    timelineRowLocked: {
      opacity: 0.6,
    },
    lockedBanner: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 6,
      backgroundColor: palette.cardBorder,
      borderRadius: 8,
      padding: 10,
      marginBottom: 8,
    },
    lockedBannerText: {
      flex: 1,
      fontSize: 12,
      lineHeight: 17,
      color: palette.secondary,
    },
    timelineDot: {
      width: 8,
      height: 8,
      borderRadius: 999,
      backgroundColor: palette.accent,
      marginTop: 6,
    },
    timelineContent: {
      flex: 1,
      gap: 4,
      minWidth: 0,
    },
    timelineDate: {
      fontSize: 12,
      color: palette.meta,
      fontWeight: "500",
    },
    timelineText: {
      fontSize: 14,
      lineHeight: 20,
      color: palette.heading,
    },
  });
};
