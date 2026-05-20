import { StyleSheet, Text, View } from "react-native";

type EmptyPlanStateProps = {
  text: string;
};

export function EmptyPlanState({ text }: EmptyPlanStateProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E8ECE7",
    backgroundColor: "#FFFFFF",
    padding: 16,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    color: "#6E7972",
  },
});
