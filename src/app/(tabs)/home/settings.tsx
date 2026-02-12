import { clientPersister, queryClient } from "@/src/api/queryClient";
import { Screen } from "@/src/components/Screen";
import {
  LanguagePreference,
  useLanguageRegion,
} from "@/src/context/LanguageRegionProvider";
import { ThemeMode, useThemeMode } from "@/src/context/ThemeModeProvider";
import { useClerk, useUser } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Avatar,
  Button,
  Divider,
  MD3Theme,
  Menu,
  SegmentedButtons,
  Surface,
  TextInput,
  useTheme,
} from "react-native-paper";

const LOCATION_STORAGE_KEY = "locationPreference";

type StoredLocation = {
  label: string;
  lat: number;
  lon: number;
};

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

const profileFields = [
  { label: "Nazwa użytkownika", value: "warzywnik.ogrodnik" },
  { label: "Imię", value: "Anna" },
  { label: "Email", value: "anna@example.com" },
];

export default function HomeSettingsScreen() {
  const router = useRouter();
  const { signOut } = useClerk();
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const { themeMode, setThemeMode } = useThemeMode();
  const { languagePreference, setLanguagePreference } = useLanguageRegion();
  const { user, isLoaded } = useUser();
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState<NominatimResult[]>([]);
  const [languageMenuVisible, setLanguageMenuVisible] = useState(false);
  const [selectedLocationLabel, setSelectedLocationLabel] = useState<
    string | null
  >(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const emailLabel =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    (isLoaded ? "Brak emaila" : "Ładowanie...");
  const languageLabelMap: Record<LanguagePreference, string> = {
    system: "Systemowy",
    pl: "Polski",
    en: "Angielski",
  };

  const nominatumHeaders = useMemo(() => {
    const headers: Record<string, string> = {
      "User-Agent": "warzywnik-mobile",
    };
    if (languagePreference !== "system") {
      headers["Accept-Language"] = languagePreference;
    }
    return headers;
  }, [languagePreference]);

  const persistLocation = useCallback(async (location: StoredLocation) => {
    try {
      await AsyncStorage.setItem(
        LOCATION_STORAGE_KEY,
        JSON.stringify(location),
      );
    } catch (error) {
      console.error("Failed to save location", error);
    }
  }, []);

  const loadStoredLocation = useCallback(async () => {
    try {
      const value = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
      if (!value) return;
      const parsed = JSON.parse(value) as StoredLocation;
      if (parsed?.label) {
        setLocationQuery(parsed.label);
        setSelectedLocationLabel(parsed.label);
      }
    } catch (error) {
      console.error("Failed to load stored location", error);
    }
  }, []);

  useEffect(() => {
    loadStoredLocation();
  }, [loadStoredLocation]);

  const fetchSearchResults = useCallback(
    async (query: string) => {
      setIsSearching(true);
      setLocationError(null);

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&q=${encodeURIComponent(
            query,
          )}`,
          { headers: nominatumHeaders },
        );
        if (!response.ok) {
          throw new Error("Search request failed");
        }
        const data = (await response.json()) as NominatimResult[];
        setLocationResults(data);
      } catch (error) {
        console.error("Location search failed", error);
        setLocationResults([]);
        setLocationError("Nie udało się wyszukać lokalizacji.");
      } finally {
        setIsSearching(false);
      }
    },
    [nominatumHeaders],
  );

  useEffect(() => {
    const trimmed = locationQuery.trim();
    if (trimmed.length < 3) {
      setLocationResults([]);
      return;
    }

    if (selectedLocationLabel && trimmed === selectedLocationLabel) {
      setLocationResults([]);
      return;
    }

    const timeout = setTimeout(() => {
      fetchSearchResults(trimmed);
    }, 400);

    return () => clearTimeout(timeout);
  }, [fetchSearchResults, locationQuery, selectedLocationLabel]);

  const handleSelectLocation = useCallback(
    (result: NominatimResult) => {
      const location: StoredLocation = {
        label: result.display_name,
        lat: Number(result.lat),
        lon: Number(result.lon),
      };
      setLocationQuery(result.display_name);
      setSelectedLocationLabel(result.display_name);
      setLocationResults([]);
      setLocationError(null);
      persistLocation(location);
    },
    [persistLocation],
  );

  const handleUseCurrentLocation = useCallback(async () => {
    setIsLocating(true);
    setLocationError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationError("Brak uprawnień do lokalizacji.");
        return;
      }

      const position = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = position.coords;

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
        { headers: nominatumHeaders },
      );

      if (!response.ok) {
        throw new Error("Reverse geocoding failed");
      }

      const data = (await response.json()) as { display_name?: string };
      const label =
        data.display_name ?? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      const location: StoredLocation = {
        label,
        lat: latitude,
        lon: longitude,
      };
      setLocationQuery(label);
      setSelectedLocationLabel(label);
      setLocationResults([]);
      persistLocation(location);
    } catch (error) {
      console.error("Using current location failed", error);
      setLocationError("Nie udało się pobrać lokalizacji.");
    } finally {
      setIsLocating(false);
    }
  }, [nominatumHeaders, persistLocation]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      queryClient.clear();
      await clientPersister.removeClient();
      router.replace("/");
    } catch (error) {
      console.error("Sign out failed", error);
    }
  }, [router, signOut]);

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Ustawienia</Text>

          <View style={styles.avatarSection}>
            <Pressable
              accessibilityLabel="Avatar użytkownika"
              style={styles.avatarPressable}
            >
              <Avatar.Icon size={84} icon="account" style={styles.avatar} />
            </Pressable>
            <Text style={styles.avatarEmail}>{emailLabel}</Text>
          </View>

          <Surface style={styles.section} elevation={0}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Profil</Text>
              <Button
                mode="text"
                onPress={() => router.push("/(tabs)/home/profile-edit")}
                compact
              >
                Edytuj
              </Button>
            </View>
            {profileFields.map((field, index) => (
              <View key={field.label}>
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>{field.label}</Text>
                  <Text style={styles.profileValue}>{field.value}</Text>
                </View>
                {index < profileFields.length - 1 ? (
                  <Divider style={styles.profileDivider} />
                ) : null}
              </View>
            ))}
          </Surface>

          <Surface style={styles.section} elevation={0}>
            <Text style={styles.sectionTitle}>Język i region</Text>
            <Text style={styles.sectionSubtitle}>Język aplikacji</Text>
            <Menu
              visible={languageMenuVisible}
              onDismiss={() => setLanguageMenuVisible(false)}
              anchor={
                <Pressable onPress={() => setLanguageMenuVisible(true)}>
                  <TextInput
                    mode="outlined"
                    value={languageLabelMap[languagePreference]}
                    editable={false}
                    pointerEvents="none"
                    right={<TextInput.Icon icon="chevron-down" />}
                    style={styles.selectInput}
                  />
                </Pressable>
              }
            >
              <Menu.Item
                onPress={() => {
                  setLanguagePreference("system");
                  setLanguageMenuVisible(false);
                }}
                title="Systemowy"
              />
              <Menu.Item
                onPress={() => {
                  setLanguagePreference("pl");
                  setLanguageMenuVisible(false);
                }}
                title="Polski"
              />
              <Menu.Item
                onPress={() => {
                  setLanguagePreference("en");
                  setLanguageMenuVisible(false);
                }}
                title="Angielski"
              />
            </Menu>

            <Text style={[styles.sectionSubtitle, styles.locationLabel]}>
              Lokalizacja
            </Text>
            <TextInput
              mode="outlined"
              value={locationQuery}
              onChangeText={(value) => {
                setLocationQuery(value);
                setSelectedLocationLabel(null);
              }}
              placeholder="Wpisz miasto, ulicę lub adres"
              style={styles.locationInput}
            />
            <Button
              mode="outlined"
              icon="crosshairs-gps"
              onPress={handleUseCurrentLocation}
              loading={isLocating}
              style={styles.locationButton}
            >
              Użyj bieżącej lokalizacji
            </Button>

            {locationError ? (
              <Text style={styles.errorText}>{locationError}</Text>
            ) : null}

            {locationResults.length > 0 ? (
              <Surface style={styles.results} elevation={0}>
                {locationResults.map((result) => (
                  <Pressable
                    key={result.place_id}
                    onPress={() => handleSelectLocation(result)}
                    style={styles.resultItem}
                  >
                    <Text style={styles.resultText}>{result.display_name}</Text>
                  </Pressable>
                ))}
              </Surface>
            ) : null}

            {locationResults.length === 0 &&
            locationQuery.trim().length >= 3 &&
            !isSearching &&
            !locationError &&
            !selectedLocationLabel ? (
              <Text style={styles.emptyHint}>Brak wyników.</Text>
            ) : null}
          </Surface>

          <Surface style={styles.section} elevation={0}>
            <Text style={styles.sectionTitle}>Wygląd</Text>
            <Text style={styles.sectionSubtitle}>Tryb motywu</Text>
            <SegmentedButtons
              value={themeMode}
              onValueChange={(value) => setThemeMode(value as ThemeMode)}
              buttons={[
                { value: "light", label: "Jasny" },
                { value: "dark", label: "Ciemny" },
                { value: "system", label: "System" },
              ]}
              style={styles.segmentedButtons}
            />
          </Surface>

          <Surface style={styles.section} elevation={0}>
            <Text style={styles.sectionTitle}>Jednostki</Text>
            <Text style={styles.placeholder}>TODO</Text>
          </Surface>
          <Surface style={styles.section} elevation={0}>
            <Text style={styles.sectionTitle}>Powiadomienia</Text>
            <Text style={styles.placeholder}>TODO</Text>
          </Surface>

          <Button
            mode="outlined"
            onPress={handleSignOut}
            textColor={theme.colors.error}
            style={[styles.signOutButton, { borderColor: theme.colors.error }]}
          >
            Wyloguj
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      padding: 20,
      paddingBottom: 40,
    },
    flex: {
      flex: 1,
    },
    title: {
      fontSize: 22,
      fontWeight: "700",
      marginBottom: 16,
      color: theme.colors.onBackground,
    },
    avatarSection: {
      alignItems: "center",
      marginBottom: 16,
    },
    avatarPressable: {
      borderRadius: 999,
    },
    avatar: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    avatarEmail: {
      marginTop: 8,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    section: {
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
      marginBottom: 12,
    },
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    sectionSubtitle: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginTop: 4,
      marginBottom: 10,
    },
    segmentedButtons: {
      alignSelf: "flex-start",
    },
    selectInput: {
      backgroundColor: theme.colors.surface,
    },
    profileRow: {
      paddingVertical: 10,
    },
    profileLabel: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    profileValue: {
      fontSize: 14,
      color: theme.colors.onSurface,
      marginTop: 4,
      fontWeight: "500",
    },
    profileDivider: {
      backgroundColor: theme.colors.outline,
      height: StyleSheet.hairlineWidth,
    },
    locationLabel: {
      marginTop: 12,
    },
    locationInput: {
      backgroundColor: theme.colors.surface,
    },
    locationButton: {
      marginTop: 10,
      alignSelf: "flex-start",
    },
    results: {
      marginTop: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
      overflow: "hidden",
    },
    resultItem: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.outline,
    },
    resultText: {
      fontSize: 13,
      color: theme.colors.onSurface,
    },
    emptyHint: {
      marginTop: 8,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    errorText: {
      marginTop: 8,
      fontSize: 12,
      color: theme.colors.error,
    },
    placeholder: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    signOutButton: {
      marginTop: 16,
      borderRadius: 12,
    },
  });
