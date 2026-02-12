import { getResponseError } from "@/src/api/axios";
import { VegetableListItem } from "@/src/api/queries/vegetables/types";
import { useGetVegetables } from "@/src/api/queries/vegetables/useGetVegetables";
import { setSelectedVegetable } from "@/src/app/(tabs)/beds/_state/vegetableSelectionStore";
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

export default function VegetablePickerScreen() {
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
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetVegetables({ q: searchQuery, limit: 20 });

  const vegetables = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data?.pages],
  );

  if (error && vegetables.length === 0) {
    return (
      <Screen>
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

  const renderItem = ({ item }: { item: VegetableListItem }) => (
    <Pressable
      style={styles.row}
      onPress={() => {
        setSelectedVegetable({ id: item.id, name: item.name });
        router.back();
      }}
    >
      <Text style={styles.rowTitle}>{item.name}</Text>
      {item.description ? (
        <Text style={styles.rowSubtitle}>{item.description}</Text>
      ) : null}
    </Pressable>
  );

  return (
    <Screen>
      <FlatList
        data={vegetables}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Wybierz warzywo</Text>
            <TextInput
              style={styles.searchInput}
              value={searchInput}
              onChangeText={setSearchInput}
              placeholder="Szukaj warzywa"
            />
            {isLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator />
              </View>
            ) : null}
          </View>
        }
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
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.center}>
              <Text style={styles.emptyTitle}>Brak warzyw</Text>
            </View>
          ) : null
        }
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
      fontSize: 20,
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
    },
    rowTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    rowSubtitle: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      marginTop: 4,
    },
    loadingRow: {
      alignItems: "center",
    },
    secondaryButton: {
      marginHorizontal: 16,
      marginTop: 16,
    },
    footerSpace: {
      height: 24,
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
      gap: 8,
    },
    errorText: {
      fontSize: 14,
      color: theme.colors.error,
      marginBottom: 12,
      textAlign: "center",
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.onBackground,
    },
  });
