import { Pressable, StyleSheet, Text, View } from "react-native";
import { MD3Theme, useTheme } from "react-native-paper";

type PlanErrorStateProps = {
  onRetry: () => void;
};

export function PlanErrorState({ onRetry }: PlanErrorStateProps) {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme.dark);
  return (
    <View style={styles.card}>
      <Text style={styles.text}>Nie udało się wczytać planu grządki.</Text>
      <Pressable onPress={onRetry} style={styles.button}>
        <Text style={styles.buttonText}>Spróbuj ponownie</Text>
      </Pressable>
    </View>
  );
}

function makeStyles(dark: boolean) {
  return StyleSheet.create({
    card: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: dark ? "#4A2830" : "#F2D3D8",
      backgroundColor: dark ? "#2A1A1C" : "#FCEFF1",
      padding: 16,
      gap: 10,
    },
    text: {
      fontSize: 14,
      lineHeight: 20,
      color: dark ? "#D66C7A" : "#B6473D",
    },
    button: {
      alignSelf: "flex-start",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: dark ? "#4A2830" : "#E9BFC7",
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    buttonText: {
      fontSize: 13,
      fontWeight: "600",
      color: dark ? "#D66C7A" : "#8D3C4E",
    },
  });
}
