import { getResponseError } from "@/src/api/axios";
import { useGetVegetables } from "@/src/api/queries/vegetables/useGetVegetables";
import { Screen } from "@/src/components/Screen";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button, MD3Theme, TextInput, useTheme } from "react-native-paper";
import { EmptyState } from "../_components/EmptyState";
import { ListRow } from "../_components/ListRow";
import { useDebouncedValue } from "../_components/useDebouncedValue";

export default function VegetablesIndexScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);

  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetVegetables({
    q: debouncedQuery.trim() ? debouncedQuery : undefined,
    limit: 20,
  });

  const items = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data?.pages],
  );

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  if (isLoading && items.length === 0) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </Screen>
    );
  }

  if (error && items.length === 0) {
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

  return (
    <Screen>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.searchBox}>
            <Text style={styles.searchLabel}>Szukaj</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Nazwa warzywa"
              style={styles.searchInput}
            />
          </View>
        }
        renderItem={({ item }) => (
          <ListRow
            title={item.name}
            subtitle={item.description ?? item.latinName ?? undefined}
            onPress={() =>
              router.push(`/(tabs)/education/vegetables/${item.id}`)
            }
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator style={styles.footer} />
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            title="Brak wyników"
            subtitle="Spróbuj zmienić zapytanie wyszukiwania."
          />
        }
      />
    </Screen>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    listContent: {
      padding: 16,
      paddingBottom: 32,
      backgroundColor: theme.colors.background,
    },
    searchBox: {
      marginBottom: 12,
    },
    searchLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.colors.onSurface,
      marginBottom: 6,
    },
    searchInput: {
      borderRadius: 10,
    },
    separator: {
      height: 10,
    },
    footer: {
      marginTop: 12,
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    errorText: {
      color: theme.colors.error,
      marginBottom: 12,
      textAlign: "center",
    },
  });
