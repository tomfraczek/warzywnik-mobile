import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeSettingsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  placeholder: {
    fontSize: 13,
    color: "#9ca3af",
  },
});
