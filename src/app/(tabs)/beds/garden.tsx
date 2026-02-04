import { StyleSheet, Text, View } from "react-native";

export default function BedsGardenScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Garden</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
});
