import { restClient } from "@/src/api/axios";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  ActivityIndicator,
  Chip,
  IconButton,
  MD3Theme,
  Portal,
  Searchbar,
  Surface,
  useTheme,
} from "react-native-paper";

const SEARCH_LIMIT = 5;
const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 350;

const CATEGORY_CONFIG = [
  { type: "vegetables", label: "Warzywa" },
  { type: "articles", label: "Artykuły" },
  { type: "fertilizers", label: "Nawozy" },
  { type: "diseases", label: "Choroby" },
  { type: "pests", label: "Szkodniki" },
  { type: "soils", label: "Gleby" },
] as const;

type SearchType = (typeof CATEGORY_CONFIG)[number]["type"];

type SearchItem = {
  id: string;
  title: string;
  subtitle?: string | null;
};

type SearchResponse = {
  query: string;
  limit: number;
  types: SearchType[];
  counts: Record<SearchType, number>;
  items: Record<SearchType, SearchItem[]>;
};

type RoutePath =
  | "/(tabs)/education/vegetables/[id]"
  | "/(tabs)/education/articles/[id]"
  | "/(tabs)/education/fertilizers/[id]"
  | "/(tabs)/education/diseases/[id]"
  | "/(tabs)/education/pests/[id]"
  | "/(tabs)/education/soils/[id]";

const ROUTE_MAP: Record<SearchType, RoutePath> = {
  vegetables: "/(tabs)/education/vegetables/[id]",
  articles: "/(tabs)/education/articles/[id]",
  fertilizers: "/(tabs)/education/fertilizers/[id]",
  diseases: "/(tabs)/education/diseases/[id]",
  pests: "/(tabs)/education/pests/[id]",
  soils: "/(tabs)/education/soils/[id]",
};

type AnchorLayout = { x: number; y: number; width: number; height: number };

export const HomeSearchBar = () => {
  const router = useRouter();
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const containerRef = useRef<View | null>(null);
  const [anchor, setAnchor] = useState<AnchorLayout | null>(null);
  const [searchText, setSearchText] = useState("");
  const [debouncedText, setDebouncedText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeType, setActiveType] = useState<SearchType | null>(null);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedText(searchText.trim());
    }, DEBOUNCE_MS);
    return () => clearTimeout(handler);
  }, [searchText]);

  useEffect(() => {
    if (searchText.trim().length < MIN_QUERY_LENGTH) {
      setIsOpen(false);
      setActiveType(null);
    }
  }, [searchText]);

  const updateAnchor = (event?: LayoutChangeEvent) => {
    if (event) {
      const { width, height } = event.nativeEvent.layout;
      if (!width || !height) return;
    }
    containerRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
    });
  };

  useEffect(() => {
    const frame = requestAnimationFrame(() => updateAnchor());
    return () => cancelAnimationFrame(frame);
  }, [windowWidth, windowHeight]);

  const trimmed = debouncedText.trim();
  const searchQuery = useQuery({
    queryKey: ["search", trimmed],
    queryFn: async () => {
      const { data } = await restClient.get<SearchResponse>("/search", {
        params: { q: trimmed, limit: SEARCH_LIMIT },
      });
      return data;
    },
    enabled: trimmed.length >= MIN_QUERY_LENGTH,
    placeholderData: keepPreviousData,
  });

  const counts = useMemo(() => {
    const fallback = {
      vegetables: 0,
      articles: 0,
      fertilizers: 0,
      diseases: 0,
      pests: 0,
      soils: 0,
    } as Record<SearchType, number>;
    return searchQuery.data?.counts ?? fallback;
  }, [searchQuery.data?.counts]);

  const hasAnyCounts = useMemo(
    () => CATEGORY_CONFIG.some((category) => counts[category.type] > 0),
    [counts],
  );

  const itemsForActiveType = useMemo(() => {
    if (!activeType) return [];
    return searchQuery.data?.items?.[activeType] ?? [];
  }, [activeType, searchQuery.data?.items]);

  const closeDropdown = () => {
    setIsOpen(false);
    setActiveType(null);
  };

  const handleResultPress = (type: SearchType, id: string) => {
    closeDropdown();
    setSearchText("");
    router.push({
      pathname: ROUTE_MAP[type],
      params: type === "articles" ? { id, fromHome: "1" } : { id },
    });
  };

  const renderChips = () => {
    if (!hasAnyCounts) {
      return <Text style={styles.emptyText}>Brak wyników</Text>;
    }

    return (
      <View style={styles.chips}>
        {CATEGORY_CONFIG.map((category) => {
          const count = counts[category.type];
          if (!count) return null;
          return (
            <Chip
              key={category.type}
              onPress={() => setActiveType(category.type)}
              style={styles.chip}
            >
              {`${category.label} (${count})`}
            </Chip>
          );
        })}
      </View>
    );
  };

  const shouldShowDropdown =
    isOpen && searchText.trim().length >= MIN_QUERY_LENGTH && anchor;

  return (
    <View ref={containerRef} onLayout={updateAnchor}>
      <View style={styles.topBar}>
        <Searchbar
          placeholder="Szukaj"
          value={searchText}
          onChangeText={(text) => {
            setSearchText(text);
            if (text.trim().length >= MIN_QUERY_LENGTH) {
              setIsOpen(true);
            }
          }}
          onFocus={() => {
            if (searchText.trim().length >= MIN_QUERY_LENGTH) {
              setIsOpen(true);
            }
          }}
          style={styles.searchbar}
        />
        <IconButton
          icon="bell-outline"
          onPress={() => undefined}
          accessibilityLabel="Powiadomienia"
        />
        <IconButton
          icon="account-circle"
          onPress={() => router.push("/(tabs)/home/settings")}
          accessibilityLabel="Profil użytkownika"
        />
      </View>

      {shouldShowDropdown ? (
        <Portal>
          <Pressable
            onPress={closeDropdown}
            style={[
              styles.overlay,
              {
                top: anchor.y + anchor.height,
                height: Math.max(0, windowHeight - (anchor.y + anchor.height)),
              },
            ]}
          />
          <Surface
            style={[
              styles.dropdown,
              {
                top: anchor.y + anchor.height + 8,
                left: anchor.x,
                width: anchor.width,
              },
            ]}
            elevation={2}
          >
            {searchQuery.isLoading || searchQuery.isFetching ? (
              <View style={styles.loading}>
                <ActivityIndicator />
              </View>
            ) : searchQuery.isError ? (
              <Text style={styles.emptyText}>Wystąpił błąd wyszukiwania</Text>
            ) : activeType ? (
              <View>
                <View style={styles.backRow}>
                  <Chip
                    compact
                    onPress={() => setActiveType(null)}
                    style={styles.backChip}
                  >
                    Wstecz
                  </Chip>
                </View>
                <View style={styles.results}>
                  {itemsForActiveType.length === 0 ? (
                    <Text style={styles.emptyText}>Brak wyników</Text>
                  ) : (
                    itemsForActiveType.map((item) => (
                      <Pressable
                        key={item.id}
                        style={styles.resultItem}
                        onPress={() => handleResultPress(activeType, item.id)}
                      >
                        <Text style={styles.resultTitle}>{item.title}</Text>
                        {item.subtitle ? (
                          <Text style={styles.resultSubtitle}>
                            {item.subtitle}
                          </Text>
                        ) : null}
                      </Pressable>
                    ))
                  )}
                </View>
              </View>
            ) : (
              renderChips()
            )}
          </Surface>
        </Portal>
      ) : null}
    </View>
  );
};

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    searchbar: {
      flex: 1,
    },
    overlay: {
      position: "absolute",
      left: 0,
      right: 0,
      backgroundColor: "transparent",
    },
    dropdown: {
      position: "absolute",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
      padding: 12,
      zIndex: 2,
    },
    loading: {
      paddingVertical: 16,
      alignItems: "center",
    },
    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    chip: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    emptyText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
    },
    backRow: {
      marginBottom: 8,
      alignSelf: "flex-start",
    },
    backChip: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    results: {
      gap: 8,
    },
    resultItem: {
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    resultTitle: {
      color: theme.colors.onSurface,
      fontSize: 14,
      fontWeight: "600",
    },
    resultSubtitle: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
      marginTop: 2,
    },
  });
