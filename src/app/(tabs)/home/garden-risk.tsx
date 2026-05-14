import { useGetMyWarnings } from "@/src/api/queries/users/useGetMyWarnings";
import { useGetMyWeather } from "@/src/api/queries/users/useGetMyWeather";
import { Screen } from "@/src/components/Screen";
import { Card } from "@/src/components/ui/Card";
import { spacing } from "@/src/theme/ui";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, MD3Theme, Text, useTheme } from "react-native-paper";

const RISK_LABEL: Record<string, string> = {
  critical: "Krytyczne",
  warning: "Wysokie",
  watch: "Podwyższone",
  ok: "Niskie",
};

const RISK_COLOR = (level: string, theme: MD3Theme) => {
  if (level === "critical") return theme.colors.error;
  if (level === "warning") return "#AA6A00";
  if (level === "watch") return "#2A6DA8";
  return "#2F6B4F";
};

export default function GardenRiskScreen() {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const router = useRouter();
  const weatherQuery = useGetMyWeather();
  const warningsQuery = useGetMyWarnings();

  const risk = weatherQuery.data?.gardenRiskStatus;
  const warnings = warningsQuery.data?.items ?? [];

  return (
    <Screen safeAreaEdges={["left", "right"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Card title="Ryzyko dla ogrodu" subtitle="Aktualny status">
          {risk ? (
            <View style={styles.riskHeader}>
              <Text
                style={[
                  styles.riskLevel,
                  { color: RISK_COLOR(risk.level ?? "ok", theme) },
                ]}
              >
                {RISK_LABEL[risk.level ?? "ok"] ?? "Nieznane"}
              </Text>
              <Text style={styles.riskTitle}>
                {risk.title ?? "Status ryzyka"}
              </Text>
              <Text style={styles.riskSubtitle}>
                {risk.subtitle ?? "Brak dodatkowych informacji."}
              </Text>
            </View>
          ) : (
            <Text style={styles.helperText}>Brak danych o ryzyku ogrodu.</Text>
          )}

          <View style={styles.actionsWrap}>
            <Button
              mode="outlined"
              onPress={() => router.push("/(tabs)/home/weather")}
            >
              Pogoda
            </Button>
            <Button
              mode="contained"
              onPress={() => router.push("/(tabs)/home/warnings")}
            >
              Szczegółowe alerty
            </Button>
          </View>
        </Card>

        <Card
          title="Alerty wpływające na ryzyko"
          subtitle="Aktywne ostrzeżenia"
        >
          {warningsQuery.isError ? (
            <Text style={styles.helperText}>Nie udało się pobrać alertów.</Text>
          ) : warnings.length === 0 ? (
            <Text style={styles.helperText}>Brak aktywnych alertów.</Text>
          ) : (
            <View style={styles.warningList}>
              {warnings.slice(0, 8).map((warning) => (
                <View key={warning.dedupeKey} style={styles.warningCard}>
                  <Text style={styles.warningTitle}>{warning.title}</Text>
                  <Text style={styles.warningText}>{warning.message}</Text>
                </View>
              ))}
            </View>
          )}
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
    riskHeader: {
      gap: spacing.xs,
    },
    riskLevel: {
      fontSize: 14,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    riskTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    riskSubtitle: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    helperText: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    actionsWrap: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    warningList: {
      gap: spacing.sm,
    },
    warningCard: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
      padding: spacing.sm,
      gap: 4,
    },
    warningTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    warningText: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
  });
