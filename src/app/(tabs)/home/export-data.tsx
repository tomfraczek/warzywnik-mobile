import { Screen } from "@/src/components/Screen";
import { useSettings } from "@/src/context/SettingsProvider";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  Button,
  MD3Theme,
  SegmentedButtons,
  Snackbar,
  useTheme,
} from "react-native-paper";

type ExportFormat = "json" | "csv";

type SnackbarState = {
  visible: boolean;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function ExportDataScreen() {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const { themeMode, languagePreference, units, location, profile } =
    useSettings();
  const [format, setFormat] = useState<ExportFormat>("json");
  const [isExporting, setIsExporting] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    visible: false,
    message: "",
  });
  const [lastExportUri, setLastExportUri] = useState<string | null>(null);

  const exportPayload = useMemo(
    () => ({
      exportedAt: new Date().toISOString(),
      settings: {
        themeMode,
        languagePreference,
        units,
        location,
        profile,
      },
      // TODO: Dołączyć dane domenowe (np. grządki, sadzenia, plony) gdy będą dostępne.
    }),
    [languagePreference, location, profile, themeMode, units],
  );

  const csvContent = useMemo(() => {
    const escapeValue = (value: unknown) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows: unknown[][] = [
      ["section", "key", "value"],
      ["settings", "themeMode", themeMode],
      ["settings", "languagePreference", languagePreference],
      ["units", "temperature", units.temperature],
      ["units", "precipitation", units.precipitation],
      ["units", "area", units.area],
      ["location", "label", location?.label ?? ""],
      ["location", "lat", location?.lat ?? ""],
      ["location", "lon", location?.lon ?? ""],
      ["profile", "name", profile.name],
      ["profile", "avatarId", profile.avatarId ?? ""],
    ];

    return rows.map((row) => row.map(escapeValue).join(",")).join("\n");
  }, [languagePreference, location, profile, themeMode, units]);

  const handleShare = useCallback(async () => {
    if (!lastExportUri) return;

    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      setSnackbar({
        visible: true,
        message: "Udostępnianie nie jest dostępne na tym urządzeniu.",
      });
      return;
    }

    await Sharing.shareAsync(lastExportUri);
  }, [lastExportUri]);

  const handleExport = useCallback(async () => {
    setIsExporting(true);

    try {
      const documentDirectory = (FileSystem as any).documentDirectory as
        | string
        | null
        | undefined;
      const cacheDirectory = (FileSystem as any).cacheDirectory as
        | string
        | null
        | undefined;
      const dateLabel = new Date().toISOString().slice(0, 10);
      const fileName = `warzywnik-export-${dateLabel}.${format}`;
      const directory = documentDirectory ?? cacheDirectory ?? null;
      if (!directory) {
        setSnackbar({
          visible: true,
          message: "Brak dostępu do katalogu dokumentów na urządzeniu.",
        });
        return;
      }

      const fileUri = `${directory}${fileName}`;

      const content =
        format === "json" ? JSON.stringify(exportPayload, null, 2) : csvContent;

      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding: "utf8",
      });

      setLastExportUri(fileUri);
      setSnackbar({
        visible: true,
        message: "Eksport zakończony.",
        actionLabel: "Udostępnij",
        onAction: handleShare,
      });
    } catch (error) {
      console.error("Export failed", error);
      setSnackbar({
        visible: true,
        message: "Nie udało się wyeksportować danych.",
      });
    } finally {
      setIsExporting(false);
    }
  }, [csvContent, exportPayload, format, handleShare]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Eksport danych</Text>
        <Text style={styles.subtitle}>
          Wybierz format pliku i utwórz kopię zapasową swoich ustawień.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Format eksportu</Text>
          <SegmentedButtons
            value={format}
            onValueChange={(value) => setFormat(value as ExportFormat)}
            buttons={[
              { value: "csv", label: "CSV" },
              { value: "json", label: "JSON" },
            ]}
            style={styles.segmentedButtons}
          />
        </View>

        <Button
          mode="contained"
          onPress={handleExport}
          loading={isExporting}
          style={styles.exportButton}
        >
          Eksportuj
        </Button>
      </ScrollView>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: "" })}
        duration={4000}
        action={
          snackbar.actionLabel && snackbar.onAction
            ? { label: snackbar.actionLabel, onPress: snackbar.onAction }
            : undefined
        }
      >
        {snackbar.message}
      </Snackbar>
    </Screen>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      padding: 20,
      paddingBottom: 40,
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.colors.onBackground,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 20,
    },
    section: {
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
      marginBottom: 20,
    },
    sectionLabel: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 10,
    },
    segmentedButtons: {
      alignSelf: "flex-start",
    },
    exportButton: {
      borderRadius: 12,
    },
  });
