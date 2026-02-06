import { getResponseError } from "@/src/api/axios";
import { useGetDisease } from "@/src/api/queries/diseases/useGetDisease";
import { useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SectionBlock } from "../_components/SectionBlock";

export default function DiseaseDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const {
    data: disease,
    isLoading,
    error,
    refetch,
  } = useGetDisease(id ?? null);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error || !disease) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{String(getResponseError(error))}</Text>
        <Pressable style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryText}>Spróbuj ponownie</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{disease.name}</Text>
      <SectionBlock title="Opis" text={disease.description ?? null} />
      <SectionBlock title="Objawy" items={disease.symptoms ?? null} />
      <SectionBlock title="Leczenie" items={disease.treatment ?? null} />
      <SectionBlock title="Zapobieganie" items={disease.prevention ?? null} />
      <SectionBlock
        title="Rośliny podatne"
        items={disease.affectedPlants ?? null}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 32,
    backgroundColor: "#fff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
  },
  errorText: {
    color: "#ef4444",
    marginBottom: 12,
    textAlign: "center",
  },
  retryButton: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  retryText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
