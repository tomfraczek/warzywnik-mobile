import { Screen } from "@/src/components/Screen";
import { radius, spacing } from "@/src/theme/ui";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, MD3Theme, Surface, Text, useTheme } from "react-native-paper";

const asParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default function AlertDetailsScreen() {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const router = useRouter();

  const params = useLocalSearchParams<{
    title?: string | string[];
    message?: string | string[];
    hint?: string | string[];
    scope?: string | string[];
    bedId?: string | string[];
    bedName?: string | string[];
    plantingId?: string | string[];
    vegetableName?: string | string[];
  }>();

  const title = asParam(params.title) ?? "Alert pogodowy";
  const message = asParam(params.message) ?? "Brak szczegółów alertu.";
  const hint = asParam(params.hint) ?? "";
  const scope = asParam(params.scope) ?? "USER";
  const bedId = asParam(params.bedId) ?? "";
  const bedName = asParam(params.bedName) ?? "";
  const plantingId = asParam(params.plantingId) ?? "";
  const vegetableName = asParam(params.vegetableName) ?? "";

  const concernLabel =
    scope === "PLANTING"
      ? vegetableName
        ? `Uprawa: ${vegetableName}`
        : "Uprawa"
      : scope === "BED"
        ? bedName
          ? `Grządka: ${bedName}`
          : "Grządka"
        : "Globalne";

  return (
    <Screen safeAreaEdges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Surface style={styles.card} elevation={0}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {hint.trim().length > 0 ? (
            <Text style={styles.hint}>{hint}</Text>
          ) : null}

          <View style={styles.concernBox}>
            <Text style={styles.concernLabel}>Dotyczy</Text>
            <Text style={styles.concernValue}>{concernLabel}</Text>
          </View>
        </Surface>

        <View style={styles.actions}>
          <Button
            mode="contained"
            onPress={() =>
              router.push({
                pathname: "/(tabs)/planner/tasks",
                params:
                  scope === "USER"
                    ? {
                        source: "WEATHER_WARNING",
                        scope: "USER",
                        scopeHint: "Zadanie dotyczy wszystkich grządek",
                      }
                    : undefined,
              })
            }
          >
            Przejdź do zadań
          </Button>

          {bedId ? (
            <Button
              mode="outlined"
              onPress={() => router.push(`/(tabs)/beds/${bedId}`)}
            >
              Przejdź do grządki
            </Button>
          ) : null}

          {plantingId ? (
            <Button
              mode="outlined"
              onPress={() => router.push(`/plantings/${plantingId}`)}
            >
              Przejdź do uprawy
            </Button>
          ) : null}
        </View>
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
    card: {
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
      padding: spacing.md,
      gap: spacing.sm,
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    message: {
      fontSize: 14,
      color: theme.colors.onSurface,
    },
    hint: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    concernBox: {
      marginTop: spacing.sm,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: spacing.sm,
      gap: spacing.xs,
      backgroundColor: theme.colors.surfaceVariant,
    },
    concernLabel: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    concernValue: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    actions: {
      gap: spacing.sm,
    },
  });
