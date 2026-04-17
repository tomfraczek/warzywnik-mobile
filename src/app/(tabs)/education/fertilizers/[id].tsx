import { getResponseError } from "@/src/api/axios";
import { useGetFertilizer } from "@/src/api/queries/fertilizers/useGetFertilizer";
import { Screen } from "@/src/components/Screen";
import { useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button, MD3Theme, useTheme } from "react-native-paper";
import { SectionBlock } from "../_components/SectionBlock";

export default function FertilizerDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const {
    data: fertilizer,
    isLoading,
    error,
    refetch,
  } = useGetFertilizer(id ?? null);
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);

  if (isLoading) {
    return (
      <Screen safeAreaEdges={["left", "right"]}>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </Screen>
    );
  }

  if (error || !fertilizer) {
    return (
      <Screen safeAreaEdges={["left", "right"]}>
        <View style={styles.center}>
          <Text style={styles.errorText}>
            {String(getResponseError(error))}
          </Text>
          <Button mode="outlined" onPress={() => refetch()}>
            Spróbuj ponownie
          </Button>
        </View>
      </Screen>
    );
  }

  return (
    <Screen safeAreaEdges={["left", "right"]}>
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
        {fertilizer.createdAt || fertilizer.updatedAt ? (
          <View style={styles.metaBlock}>
            {fertilizer.createdAt ? (
              <Text style={styles.metaText}>
                Utworzono:{" "}
                {new Date(fertilizer.createdAt).toLocaleDateString("pl-PL")}
              </Text>
            ) : null}
            {fertilizer.updatedAt ? (
              <Text style={styles.metaText}>
                Zaktualizowano:{" "}
                {new Date(fertilizer.updatedAt).toLocaleDateString("pl-PL")}
              </Text>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      padding: 20,
      paddingBottom: 32,
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    title: {
      fontSize: 20,
      fontWeight: "600",
      marginBottom: 4,
      color: theme.colors.onBackground,
    },
    subtitle: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 12,
    },
    errorText: {
      color: theme.colors.error,
      marginBottom: 12,
      textAlign: "center",
    },
    metaBlock: {
      marginTop: 24,
      gap: 4,
    },
    metaText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
  });
