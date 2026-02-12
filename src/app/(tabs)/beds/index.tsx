import { getResponseError } from "@/src/api/axios";
import { Bed } from "@/src/api/queries/beds/types";
import { useGetBeds } from "@/src/api/queries/beds/useGetBeds";
import { Screen } from "@/src/components/Screen";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button, MD3Theme, TextInput, useTheme } from "react-native-paper";

const getSoilLabel = (bed: Bed) =>
  bed.soil?.name ?? (bed as any)?.soilName ?? "Brak";

export default function BedsListScreen() {
  const router = useRouter();
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handle = setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 350);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    error,
    refetch,
    isRefetching,
  } = useGetBeds({ q: searchQuery, limit: 20 });

  const beds = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data?.pages],
  );

  const renderItem = ({ item }: { item: Bed }) => {
    const soilLabel = getSoilLabel(item);
    return (
      <Pressable
        style={styles.row}
        onPress={() => router.push(`/(tabs)/beds/${item.id}`)}
      >
        <View style={styles.rowMain}>
          <Text style={styles.rowTitle}>{item.name}</Text>
          {item.locationLabel ? (
            <Text style={styles.rowSubtitle}>{item.locationLabel}</Text>
          ) : null}
        </View>
        <View style={styles.rowMeta}>
          <Text style={styles.rowMetaText}>{soilLabel}</Text>
          <Text style={styles.rowMetaBadge}>
            {item.isActive === false ? "Nieaktywna" : "Aktywna"}
          </Text>
        </View>
      </Pressable>
    );
  };

  const listHeader = (
    <View style={styles.header}>
      <Text style={styles.title}>Grządki</Text>
      <TextInput
        style={styles.searchInput}
        value={searchInput}
        onChangeText={setSearchInput}
        placeholder="Szukaj po nazwie"
      />
      <Button mode="contained" onPress={() => router.push("/(tabs)/beds/new")}>
        + Dodaj grządkę
      </Button>
      {isLoading || isRefetching ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator />
        </View>
      ) : null}
    </View>
  );

  if (error && beds.length === 0) {
    return (
      <Screen safeAreaEdges={["top", "left", "right"]}>
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

  if (!isLoading && beds.length === 0) {
    return (
      <Screen safeAreaEdges={["top", "left", "right"]}>
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Nie masz jeszcze grządek</Text>
          <Text style={styles.emptySubtitle}>Dodaj pierwszą grządkę</Text>
          <Button
            mode="contained"
            onPress={() => router.push("/(tabs)/beds/new")}
          >
            Dodaj pierwszą grządkę
          </Button>
        </View>
      </Screen>
    );
  }

  return (
    <Screen safeAreaEdges={["top", "left", "right"]}>
      <FlatList
        data={beds}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={listHeader}
        ListFooterComponent={
          hasNextPage ? (
            <Button
              mode="outlined"
              onPress={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              style={styles.secondaryButton}
            >
              {isFetchingNextPage ? "Ładowanie..." : "Wczytaj więcej"}
            </Button>
          ) : (
            <View style={styles.footerSpace} />
          )
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
      />
    </Screen>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    listContent: {
      paddingBottom: 24,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: 16,
      gap: 12,
    },
    title: {
      fontSize: 22,
      fontWeight: "700",
      color: theme.colors.onBackground,
    },
    searchInput: {
      borderRadius: 10,
    },
    row: {
      borderTopWidth: 1,
      borderColor: theme.colors.outlineVariant,
      paddingHorizontal: 16,
      paddingVertical: 14,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    rowMain: {
      flex: 1,
      paddingRight: 12,
    },
    rowTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    rowSubtitle: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      marginTop: 4,
    },
    rowMeta: {
      alignItems: "flex-end",
    },
    rowMetaText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 6,
    },
    rowMetaBadge: {
      fontSize: 11,
      color: theme.colors.primary,
    },
    secondaryButton: {
      marginHorizontal: 16,
      marginTop: 16,
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
      gap: 8,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "600",
      marginBottom: 4,
      color: theme.colors.onBackground,
    },
    emptySubtitle: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 8,
    },
    errorText: {
      fontSize: 14,
      color: theme.colors.error,
      marginBottom: 12,
      textAlign: "center",
    },
    loadingRow: {
      alignItems: "center",
    },
    footerSpace: {
      height: 24,
    },
  });
