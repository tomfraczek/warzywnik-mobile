import { Screen } from "@/src/components/Screen";
import { ThemeMode, useThemeMode } from "@/src/context/ThemeModeProvider";
import { StyleSheet, Text, View } from "react-native";
import { MD3Theme, SegmentedButtons, useTheme } from "react-native-paper";

export default function HomeSettingsScreen() {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const { themeMode, setThemeMode } = useThemeMode();

  return (
    <Screen style={styles.container}>
      <Text style={styles.title}>Ustawienia</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Język i region</Text>
        <Text style={styles.placeholder}>TODO</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wygląd</Text>
        <Text style={styles.sectionSubtitle}>Tryb motywu</Text>
        <SegmentedButtons
          value={themeMode}
          onValueChange={(value) => setThemeMode(value as ThemeMode)}
          buttons={[
            { value: "light", label: "Jasny" },
            { value: "dark", label: "Ciemny" },
            { value: "system", label: "System" },
          ]}
          style={styles.segmentedButtons}
        />
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Jednostki</Text>
        <Text style={styles.placeholder}>TODO</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Powiadomienia</Text>
        <Text style={styles.placeholder}>TODO</Text>
      </View>
    </Screen>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      padding: 20,
    },
    title: {
      fontSize: 22,
      fontWeight: "700",
      marginBottom: 20,
      color: theme.colors.onBackground,
    },
    section: {
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 6,
      color: theme.colors.onSurface,
    },
    sectionSubtitle: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 10,
    },
    segmentedButtons: {
      alignSelf: "flex-start",
    },
    placeholder: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
  });
