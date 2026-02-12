import { Screen } from "@/src/components/Screen";
import { StyleSheet, Text, View } from "react-native";
import { MD3Theme, useTheme } from "react-native-paper";

export default function HomeSettingsScreen() {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);

  return (
    <Screen style={styles.container}>
      <Text style={styles.title}>Ustawienia</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Język i region</Text>
        <Text style={styles.placeholder}>TODO</Text>
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
    placeholder: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
  });
