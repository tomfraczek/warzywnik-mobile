import { StyleSheet, Text, View } from "react-native";

export default function ArticleDetailsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Artykuł</Text>
      <Text style={styles.subtitle}>
        Szczegóły będą dostępne po podłączeniu CMS.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  subtitle: {
    color: "#6b7280",
  },
});
