import { getResponseError } from "@/src/api/axios";
import { useGetFertilizer } from "@/src/api/queries/fertilizers/useGetFertilizer";
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

export default function FertilizerDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const {
    data: fertilizer,
    isLoading,
    error,
    refetch,
  } = useGetFertilizer(id ?? null);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error || !fertilizer) {
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
      <Text style={styles.title}>{fertilizer.name}</Text>
      {fertilizer.category ? (
        <Text style={styles.subtitle}>{fertilizer.category}</Text>
      ) : null}
      <SectionBlock title="Opis" text={fertilizer.description ?? null} />
      <SectionBlock title="Zastosowanie" text={fertilizer.usage ?? null} />
      <SectionBlock title="Skład" items={fertilizer.composition ?? null} />
      <SectionBlock title="Zalety" items={fertilizer.advantages ?? null} />
      <SectionBlock title="Wady" items={fertilizer.disadvantages ?? null} />
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#6b7280",
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
