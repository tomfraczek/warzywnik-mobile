import { StyleSheet, Text, View } from "react-native";
import { MD3Theme, useTheme } from "react-native-paper";

type EmptyPlanStateProps = {
  text: string;
};

export function EmptyPlanState({ text }: EmptyPlanStateProps) {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme.dark);
  return (
    <View style={styles.card}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

function makeStyles(dark: boolean) {
  return StyleSheet.create({
    card: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: dark ? "rgba(255, 255, 255, 0.12)" : "#E8ECE7",
      backgroundColor: dark ? "#1A1F1C" : "#FFFFFF",
      padding: 16,
    },
    text: {
      fontSize: 14,
      lineHeight: 20,
      color: dark ? "#9AA59E" : "#6E7972",
    },
  });
}
