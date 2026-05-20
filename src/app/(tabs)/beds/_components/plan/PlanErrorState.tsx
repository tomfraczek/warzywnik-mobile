import { Pressable, StyleSheet, Text, View } from "react-native";

type PlanErrorStateProps = {
  onRetry: () => void;
};

export function PlanErrorState({ onRetry }: PlanErrorStateProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.text}>Nie udało się wczytać planu grządki.</Text>
      <Pressable onPress={onRetry} style={styles.button}>
        <Text style={styles.buttonText}>Spróbuj ponownie</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F2D3D8",
    backgroundColor: "#FCEFF1",
    padding: 16,
    gap: 10,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    color: "#B6473D",
  },
  button: {
    alignSelf: "flex-start",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E9BFC7",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8D3C4E",
  },
});
