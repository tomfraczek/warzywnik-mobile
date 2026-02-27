import { Bed } from "@/src/api/queries/beds/types";
import { useGetBeds } from "@/src/api/queries/beds/useGetBeds";
import { useGetPlantings } from "@/src/api/queries/plantings/useGetPlantings";
import { Screen } from "@/src/components/Screen";
import { Card } from "@/src/components/ui/Card";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { radius, spacing } from "@/src/theme/ui";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { FAB, MD3Theme, Text, TextInput, useTheme } from "react-native-paper";

const getSoilLabel = (bed: Bed) => bed.soil?.name ?? "Nie wybrano";

export default function BedsListScreen() {
  const router = useRouter();
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const [searchInput, setSearchInput] = useState("");

  const bedsQuery = useGetBeds({
    q: searchInput.trim() || undefined,
    limit: 50,
  });
  const plantingsQuery = useGetPlantings({ limit: 100 });

  const beds = useMemo(
    () => bedsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [bedsQuery.data?.pages],
  );

  const activePlantingsCountByBed = useMemo(() => {
    const counts = new Map<string, number>();
    const items =
      plantingsQuery.data?.pages.flatMap((page) => page.items) ?? [];
    items.forEach((item) => {
      if (!item.bedId) return;
      if (item.status === "CANCELLED" || item.status === "FINISHED") return;
      counts.set(item.bedId, (counts.get(item.bedId) ?? 0) + 1);
    });
    return counts;
  }, [plantingsQuery.data?.pages]);

  if (bedsQuery.isLoading && beds.length === 0) {
    return (
      <Screen safeAreaEdges={["top", "left", "right"]}>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </Screen>
    );
  }

  return (
    <Screen safeAreaEdges={["top", "left", "right"]}>
      <View style={styles.container}>
        <FlatList
          data={beds}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.title}>Grządki</Text>
              <Text style={styles.subtitle}>
                Monitoruj status i aktywność każdej grządki
              </Text>
              <TextInput
                mode="outlined"
                value={searchInput}
                onChangeText={setSearchInput}
                placeholder="Szukaj grządki"
              />
            </View>
          }
          renderItem={({ item }) => {
            const area =
              item.lengthCm && item.widthCm
                ? `${item.lengthCm} × ${item.widthCm} cm`
                : "Brak wymiarów";
            const activeCount = activePlantingsCountByBed.get(item.id) ?? 0;

            return (
              <Pressable onPress={() => router.push(`/(tabs)/beds/${item.id}`)}>
                <Card>
                  <View style={styles.rowTop}>
                    <Text style={styles.bedName}>{item.name}</Text>
                    <StatusBadge
                      label={item.isActive === false ? "Nieaktywna" : "Aktywna"}
                      tone={item.isActive === false ? "neutral" : "success"}
                    />
                  </View>

                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <MaterialCommunityIcons
                        name="seed-outline"
                        size={16}
                        color={theme.colors.onSurfaceVariant}
                      />
                      <Text style={styles.metaText}>
                        Gleba: {getSoilLabel(item)}
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <MaterialCommunityIcons
                        name="ruler-square"
                        size={16}
                        color={theme.colors.onSurfaceVariant}
                      />
                      <Text style={styles.metaText}>{area}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <MaterialCommunityIcons
                        name="sprout"
                        size={16}
                        color={theme.colors.onSurfaceVariant}
                      />
                      <Text style={styles.metaText}>
                        Aktywne uprawy: {activeCount}
                      </Text>
                    </View>
                  </View>
                </Card>
              </Pressable>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          ListEmptyComponent={
            <Card>
              <Text style={styles.emptyTitle}>Nie masz jeszcze grządek</Text>
              <Text style={styles.emptySubtitle}>
                Dodaj pierwszą grządkę przyciskiem poniżej.
              </Text>
            </Card>
          }
        />

        <FAB
          icon="plus"
          label="Dodaj grządkę"
          color={theme.colors.onPrimary}
          style={styles.fab}
          onPress={() => router.push("/(tabs)/beds/new")}
        />
      </View>
    </Screen>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      padding: spacing.md,
      paddingBottom: 110,
    },
    header: {
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    title: {
      fontSize: 26,
      fontWeight: "700",
      color: theme.colors.onBackground,
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 13,
    },
    rowTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing.sm,
    },
    bedName: {
      flex: 1,
      fontSize: 18,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    metaRow: {
      gap: spacing.sm,
    },
    metaItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    metaText: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    emptySubtitle: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.lg,
    },
    fab: {
      position: "absolute",
      right: spacing.md,
      bottom: spacing.md,
      borderRadius: radius.pill,
      backgroundColor: theme.colors.primary,
    },
  });
