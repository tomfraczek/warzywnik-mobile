import { getResponseError } from "@/src/api/axios";
import { Bed } from "@/src/api/queries/beds/types";
import { useGetBeds } from "@/src/api/queries/beds/useGetBeds";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const getSoilLabel = (bed: Bed) =>
  bed.soil?.name ?? (bed as any)?.soilName ?? "Brak";

export default function BedsListScreen() {
  const router = useRouter();
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
      <Pressable
        style={styles.primaryButton}
        onPress={() => router.push("/(tabs)/beds/new")}
      >
        <Text style={styles.primaryButtonText}>+ Dodaj grządkę</Text>
      </Pressable>
      {isLoading || isRefetching ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator />
        </View>
      ) : null}
    </View>
  );

  if (error && beds.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{String(getResponseError(error))}</Text>
        <Pressable style={styles.secondaryButton} onPress={() => refetch()}>
          <Text style={styles.secondaryButtonText}>Spróbuj ponownie</Text>
        </Pressable>
      </View>
    );
  }

  if (!isLoading && beds.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Nie masz jeszcze grządek</Text>
        <Text style={styles.emptySubtitle}>Dodaj pierwszą grządkę</Text>
        <Pressable
          style={styles.primaryButton}
          onPress={() => router.push("/(tabs)/beds/new")}
        >
          <Text style={styles.primaryButtonText}>Dodaj pierwszą grządkę</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={beds}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={listHeader}
      ListFooterComponent={
        hasNextPage ? (
          <Pressable
            style={styles.secondaryButton}
            onPress={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.secondaryButtonText}>Wczytaj więcej</Text>
            )}
          </Pressable>
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
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 24,
    backgroundColor: "#fff",
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
  },
  row: {
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
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
  },
  rowSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 4,
  },
  rowMeta: {
    alignItems: "flex-end",
  },
  rowMetaText: {
    fontSize: 12,
    color: "#374151",
    marginBottom: 6,
  },
  rowMetaBadge: {
    fontSize: 11,
    color: "#2563eb",
  },
  primaryButton: {
    backgroundColor: "#111827",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 8,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  secondaryButton: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#111827",
    fontWeight: "600",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: "#dc2626",
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
