import { StyleSheet, Text, View } from "react-native";
import { EmptyState } from "../_components/EmptyState";

export default function ArticlesIndexScreen() {
  return (
    <View style={styles.container}>
      <EmptyState
        title="Brak źródła artykułów"
        subtitle="TODO: podłączyć endpoint CMS/blog, gdy będzie dostępny."
      />
      <Text style={styles.note}>To miejsce na listę artykułów.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  note: {
    textAlign: "center",
    color: "#6b7280",
    fontSize: 12,
    marginTop: -8,
  },
});
