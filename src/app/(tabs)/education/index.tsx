import { StyleSheet, Text, View } from "react-native";

const sections = [
  "Blog / artykuły",
  "Indeks warzyw",
  "Indeks gleb",
  "Indeks szkodników",
  "Indeks nawozów",
];

export default function EducationScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edukacja</Text>
      <View style={styles.list}>
        {sections.map((section) => (
          <View key={section} style={styles.listItem}>
            <Text style={styles.listText}>{section}</Text>
          </View>
        ))}
      </View>
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
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  list: {
    gap: 12,
  },
  listItem: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    backgroundColor: "#f9fafb",
  },
  listText: {
    fontSize: 14,
    color: "#111827",
  },
});