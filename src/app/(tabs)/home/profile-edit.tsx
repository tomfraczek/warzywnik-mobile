import { Screen } from "@/src/components/Screen";
import { StyleSheet, Text, View } from "react-native";
import { MD3Theme, useTheme } from "react-native-paper";

export default function ProfileEditScreen() {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);

  return (
    <Screen style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Edycja profilu</Text>
        <Text style={styles.subtitle}>Wkrótce dodamy edycję danych.</Text>
      </View>
    </Screen>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      padding: 20,
    },
    card: {
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
    },
    title: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.onSurface,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
  });
