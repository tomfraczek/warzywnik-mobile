import { Screen } from "@/src/components/Screen";
import { StyleSheet, Text, View } from "react-native";
import { MD3Theme, useTheme } from "react-native-paper";

export default function PlannerCalendarScreen() {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Calendar</Text>
      </View>
    </Screen>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.colors.onBackground,
    },
  });
