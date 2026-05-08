import { getResponseError } from "@/src/api/axios";
import { VegetableListItem } from "@/src/api/queries/vegetables/types";
import { useGetVegetables } from "@/src/api/queries/vegetables/useGetVegetables";
import { setSelectedVegetable } from "@/src/app/(tabs)/beds/_state/vegetableSelectionStore";
import { Screen } from "@/src/components/Screen";
import CustomHeader from "@/src/components/navigation/CustomHeader";
import { OFFLINE_MUTATION_MESSAGE } from "@/src/features/network/offline";
import { useIsOffline } from "@/src/hooks/useNetworkStatus";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Button, Icon, MD3Theme, useTheme } from "react-native-paper";

function buildPalette(dark: boolean) {
  return {
    background: dark ? "#141816" : "#F7F8F5",
    cardBg: dark ? "#1A1F1C" : "#FFFFFF",
    cardBorder: dark ? "#252D29" : "#E8ECE7",
    heading: dark ? "#F2F5F1" : "#1D2420",
    secondary: dark ? "#9AA59E" : "#6E7972",
    tertiary: dark ? "#7A8880" : "#97A29B",
    accent: dark ? "#7AB88A" : "#4A7C59",
    accentBg: dark ? "#1A2E1F" : "#EBF5EE",
    accentBorder: dark ? "#2A4A32" : "#C5DFC9",
    searchBg: dark ? "#1A211D" : "#F1F5F1",
    searchBorder: dark ? "#2C3530" : "#E1E8E2",
    searchPlaceholder: dark ? "#6F7A73" : "#9AA59E",
    imagePlaceholderBg: dark ? "#1F2823" : "#ECF4EE",
    imagePlaceholderIcon: dark ? "#8FB79A" : "#76A484",
    noticeBg: dark ? "#212A24" : "#EFF5F0",
    noticeBorder: dark ? "#2F3C34" : "#D8E6D9",
    noticeText: dark ? "#AFC7B6" : "#4F6A58",
    errorBg: dark ? "#2B1F20" : "#FCEFF1",
    errorBorder: dark ? "#4A3336" : "#F2D3D8",
    errorText: dark ? "#E5A7B2" : "#B44A5E",
    skeleton: dark ? "#2A332E" : "#E8EEE9",
  };
}

function VegetableRowSkeleton({
  palette,
}: {
  palette: ReturnType<typeof buildPalette>;
}) {
  return (
    <View
      style={[
        styles.rowCard,
        {
          backgroundColor: palette.cardBg,
          borderColor: palette.cardBorder,
        },
      ]}
    >
      <View style={[styles.rowImage, { backgroundColor: palette.skeleton }]} />
      <View style={styles.rowBody}>
        <View
          style={[
            styles.skeletonLineMain,
            { backgroundColor: palette.skeleton },
          ]}
        />
        <View
          style={[
            styles.skeletonLineSub,
            { backgroundColor: palette.skeleton },
          ]}
        />
      </View>
    </View>
  );
}

export default function VegetablePickerScreen() {
  const router = useRouter();
  const theme = useTheme<MD3Theme>();
  const palette = buildPalette(theme.dark);
  const isOffline = useIsOffline();
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
  const initialLoading = isLoading && vegetables.length === 0;

  const renderItem = ({ item }: { item: VegetableListItem }) => (
    <Pressable
      style={({ pressed }) => [
        styles.rowCard,
        {
          backgroundColor: palette.cardBg,
          borderColor: palette.cardBorder,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
      onPress={() => {
        setSelectedVegetable({ id: item.id, name: item.name });
        router.back();
      }}
    >
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.rowImage}
          contentFit="cover"
        />
      ) : (
        <View
          style={[
            styles.rowImage,
            { backgroundColor: palette.imagePlaceholderBg },
          ]}
        >
          <Icon
            source="sprout-outline"
            size={24}
            color={palette.imagePlaceholderIcon}
          />
        </View>
      )}

      <View style={styles.rowBody}>
        <Text
          style={[styles.rowTitle, { color: palette.heading }]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        {item.latinName ? (
          <Text
            style={[styles.rowLatin, { color: palette.secondary }]}
            numberOfLines={1}
          >
            {item.latinName}
          </Text>
        ) : null}
      </View>

      <View style={styles.rowActionWrap}>
        <Text style={[styles.rowActionText, { color: palette.accent }]}>
          Wybierz
        </Text>
        <Icon source="chevron-right" size={20} color={palette.accent} />
      </View>
    </Pressable>
  );

  return (
    <Screen
      style={{ backgroundColor: palette.background }}
      safeAreaEdges={["left", "right", "bottom"]}
    >
      <CustomHeader showBack />

      <FlatList
        data={vegetables}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: palette.heading }]}>
              Wybierz warzywo
            </Text>
            <Text style={[styles.subtitle, { color: palette.secondary }]}>
              Wybierz roślinę, którą chcesz dodać do grządki.
            </Text>

            <View
              style={[
                styles.searchBar,
                {
                  backgroundColor: palette.searchBg,
                  borderColor: palette.searchBorder,
                },
              ]}
            >
              <Icon
                source="magnify"
                size={21}
                color={palette.searchPlaceholder}
              />
              <TextInput
                value={searchInput}
                onChangeText={setSearchInput}
                placeholder="Szukaj warzywa..."
                placeholderTextColor={palette.searchPlaceholder}
                style={[styles.searchInput, { color: palette.heading }]}
              />
            </View>

            {isOffline ? (
              <View
                style={[
                  styles.offlineNotice,
                  {
                    backgroundColor: palette.noticeBg,
                    borderColor: palette.noticeBorder,
                  },
                ]}
              >
                <Icon
                  source="wifi-strength-off-outline"
                  size={16}
                  color={palette.noticeText}
                />
                <Text
                  style={[
                    styles.offlineNoticeText,
                    { color: palette.noticeText },
                  ]}
                >
                  {OFFLINE_MUTATION_MESSAGE}
                </Text>
              </View>
            ) : null}

            {initialLoading
              ? [0, 1, 2, 3, 4].map((idx) => (
                  <VegetableRowSkeleton
                    key={`skeleton-${idx}`}
                    palette={palette}
                  />
                ))
              : null}

            {error && vegetables.length === 0 && !initialLoading ? (
              <View
                style={[
                  styles.errorCard,
                  {
                    backgroundColor: palette.errorBg,
                    borderColor: palette.errorBorder,
                  },
                ]}
              >
                <Text style={[styles.errorText, { color: palette.errorText }]}>
                  {String(getResponseError(error))}
                </Text>
                <Button mode="outlined" onPress={() => refetch()}>
                  Spróbuj ponownie
                </Button>
              </View>
            ) : null}
          </View>
        }
        ListFooterComponent={
          !initialLoading && hasNextPage ? (
            <Button
              mode="outlined"
              onPress={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              style={styles.loadMoreButton}
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
        onEndReachedThreshold={0.35}
        ListEmptyComponent={
          !initialLoading && !error ? (
            <View style={styles.emptyWrap}>
              <View
                style={[
                  styles.emptyIconWrap,
                  { backgroundColor: palette.imagePlaceholderBg },
                ]}
              >
                <Icon
                  source="sprout-outline"
                  size={26}
                  color={palette.imagePlaceholderIcon}
                />
              </View>
              <Text style={[styles.emptyTitle, { color: palette.heading }]}>
                Nie znaleziono warzyw
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: palette.secondary }]}
              >
                Spróbuj zmienić frazę wyszukiwania.
              </Text>
            </View>
          ) : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 12,
  },
  headerContent: {
    gap: 14,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: -6,
  },
  searchBar: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 10,
  },
  offlineNotice: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  offlineNoticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500",
  },
  rowCard: {
    minHeight: 92,
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 2,
  },
  rowImage: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  rowBody: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
  },
  rowLatin: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: "italic",
  },
  rowActionWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  rowActionText: {
    fontSize: 13,
    fontWeight: "600",
  },
  loadMoreButton: {
    marginTop: 10,
    marginBottom: 4,
  },
  footerSpace: {
    height: 12,
  },
  errorCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    marginTop: 2,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
  },
  emptyWrap: {
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  skeletonLineMain: {
    width: "75%",
    height: 14,
    borderRadius: 999,
  },
  skeletonLineSub: {
    width: "55%",
    height: 11,
    borderRadius: 999,
  },
});
