import { useUpdateNotificationPreferences } from "@/src/api/mutations/notifications/useUpdateNotificationPreferences";
import { GeoSearchItem } from "@/src/api/queries/geo/types";
import { useGeoSearch } from "@/src/api/queries/geo/useGeoSearch";
import { useUpdateUserLocation } from "@/src/api/queries/geo/useUpdateUserLocation";
import { UpdateNotificationPreferencesDto } from "@/src/api/queries/notifications/types";
import { useGetNotificationPreferences } from "@/src/api/queries/notifications/useGetNotificationPreferences";
import { updateMe } from "@/src/api/queries/users/useUpdateMe";
import { queryClient } from "@/src/api/queryClient";
import { Screen } from "@/src/components/Screen";
import { Card } from "@/src/components/ui/Card";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { getAvatarSource } from "@/src/constants/avatars";
import {
  LanguagePreference,
  ThemeMode,
  useSettings,
} from "@/src/context/SettingsProvider";
import { OFFLINE_MUTATION_MESSAGE } from "@/src/features/network/offline";
// import { isPushDiagnosticsVisible } from "@/src/features/push/diagnostics";
import { useIsOffline } from "@/src/hooks/useNetworkStatus";
import { radius, spacing } from "@/src/theme/ui";
import { useClerk, useUser } from "@clerk/clerk-expo";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import {
  Avatar,
  Button,
  Divider,
  MD3Theme,
  SegmentedButtons,
  Snackbar,
  Switch,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

const languageLabels: Record<LanguagePreference, string> = {
  system: "System",
  pl: "Polski",
  en: "English",
};

export default function ProfileScreen() {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();
  const {
    profile,
    themeMode,
    setThemeMode,
    languagePreference,
    setLanguagePreference,
    location,
    setLocationPreference,
    tutorials,
    setTutorials,
  } = useSettings();
  const updateLocation = useUpdateUserLocation();
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [locationQuery, setLocationQuery] = useState(location?.label ?? "");
  const [debouncedLocationQuery, setDebouncedLocationQuery] = useState(
    location?.label ?? "",
  );
  const [selectedLocationLabel, setSelectedLocationLabel] = useState<
    string | null
  >(location?.label ?? null);
  const preferencesQuery = useGetNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();

  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    "Brak emaila";
  const avatarSource = getAvatarSource(profile.avatarId);

  const preferences = preferencesQuery.data;
  const notificationsEnabled = preferences?.notificationsEnabled ?? false;

  const geoLanguage =
    languagePreference === "system" ? undefined : languagePreference;
  const trimmedQuery = debouncedLocationQuery.trim();
  const shouldSearchManualLocation =
    trimmedQuery.length >= 3 &&
    (!selectedLocationLabel || trimmedQuery !== selectedLocationLabel);

  const geoSearchQuery = useGeoSearch(trimmedQuery, geoLanguage, {
    enabled: shouldSearchManualLocation,
  });
  const locationResults = shouldSearchManualLocation
    ? (geoSearchQuery.data ?? [])
    : [];
  const isSearching = shouldSearchManualLocation && geoSearchQuery.isFetching;

  useEffect(() => {
    if (!location?.label) return;
    setLocationQuery(location.label);
    setDebouncedLocationQuery(location.label);
    setSelectedLocationLabel(location.label);
  }, [location?.label]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedLocationQuery(locationQuery);
    }, 400);
    return () => clearTimeout(timeout);
  }, [locationQuery]);

  const isOffline = useIsOffline();

  const handleCurrentLocation = useCallback(async () => {
    if (isOffline) {
      Alert.alert("Tryb offline", OFFLINE_MUTATION_MESSAGE);
      return;
    }
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setSnackbar("Brak uprawnień do lokalizacji.");
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      const [place] = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lon,
      });
      const label = place
        ? [place.city ?? place.subregion ?? place.region, place.country]
            .filter(Boolean)
            .join(", ")
        : `${lat.toFixed(4)}, ${lon.toFixed(4)}`;

      await updateLocation.mutateAsync({
        mode: "DEVICE",
        label,
        lat,
        lon,
      });

      setLocationPreference({
        mode: "DEVICE",
        label,
        lat,
        lon,
        updatedAt: Date.now(),
      });
      setLocationQuery(label);
      setDebouncedLocationQuery(label);
      setSelectedLocationLabel(label);
      setSnackbar("Zaktualizowano lokalizację.");
    } catch {
      setSnackbar("Nie udało się pobrać lokalizacji.");
    }
  }, [isOffline, setLocationPreference, updateLocation]);

  const handleSelectManualLocation = useCallback(
    async (result: GeoSearchItem) => {
      if (isOffline) {
        Alert.alert("Tryb offline", OFFLINE_MUTATION_MESSAGE);
        return;
      }
      try {
        await updateLocation.mutateAsync({
          mode: "MANUAL",
          label: result.label,
          lat: result.lat,
          lon: result.lon,
          providerPlaceId: result.placeId,
        });

        setLocationPreference({
          mode: "MANUAL",
          label: result.label,
          lat: result.lat,
          lon: result.lon,
          providerPlaceId: result.placeId,
          updatedAt: Date.now(),
        });

        setLocationQuery(result.label);
        setDebouncedLocationQuery(result.label);
        setSelectedLocationLabel(result.label);
        setSnackbar("Zmieniono lokalizację.");
      } catch {
        setSnackbar("Nie udało się zapisać lokalizacji.");
      }
    },
    [isOffline, setLocationPreference, updateLocation],
  );

  const handleSignOut = useCallback(async () => {
    try {
      await queryClient.cancelQueries();
      await signOut();
    } catch {
      Alert.alert("Błąd", "Nie udało się wylogować.");
    }
  }, [signOut]);

  const updateNotificationPreference = useCallback(
    async (patch: UpdateNotificationPreferencesDto) => {
      try {
        await updatePreferences.mutateAsync(patch);
      } catch {
        setSnackbar("Nie udało się zapisać preferencji powiadomień.");
      }
    },
    [updatePreferences],
  );

  const incrementNotificationHour = useCallback(() => {
    if (!preferences) return;
    const nextHour = Math.min(23, preferences.notificationHour + 1);
    void updateNotificationPreference({ notificationHour: nextHour });
  }, [preferences, updateNotificationPreference]);

  const decrementNotificationHour = useCallback(() => {
    if (!preferences) return;
    const nextHour = Math.max(0, preferences.notificationHour - 1);
    void updateNotificationPreference({ notificationHour: nextHour });
  }, [preferences, updateNotificationPreference]);

  return (
    <Screen safeAreaEdges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Profil i ustawienia</Text>

        <Card>
          <View style={styles.userRow}>
            {avatarSource ? (
              <Avatar.Image size={64} source={avatarSource} />
            ) : (
              <Avatar.Icon size={64} icon="account" />
            )}
            <View style={styles.userMeta}>
              <Text style={styles.userName}>
                {profile.name || "Użytkownik"}
              </Text>
              <Text style={styles.userEmail}>{email}</Text>
            </View>
            <Button
              compact
              mode="text"
              onPress={() => router.push("/(tabs)/profile/profile-edit")}
            >
              Edytuj
            </Button>
          </View>
        </Card>

        <Card title="Preferencje">
          <Text style={styles.label}>Język i region</Text>
          <View style={styles.inlineWrap}>
            {(["system", "pl", "en"] as LanguagePreference[]).map((lang) => (
              <Pressable
                key={lang}
                style={styles.chip}
                onPress={() => setLanguagePreference(lang)}
              >
                <StatusBadge
                  label={languageLabels[lang]}
                  tone={languagePreference === lang ? "success" : "neutral"}
                />
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Lokalizacja</Text>
          <Text style={styles.helper}>
            {location?.label ?? "Brak ustawionej lokalizacji"}
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
            left={<TextInput.Icon icon="map-marker" />}
          />

          {locationResults.length > 0 ? (
            <View style={styles.results}>
              {locationResults.map((result) => (
                <Pressable
                  key={result.placeId}
                  onPress={() => handleSelectManualLocation(result)}
                  style={styles.resultItem}
                  disabled={updateLocation.isPending || isOffline}
                >
                  <Text style={styles.resultText}>{result.label}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {locationResults.length === 0 &&
          locationQuery.trim().length >= 3 &&
          !isSearching &&
          !selectedLocationLabel ? (
            <Text style={styles.helper}>Brak wyników.</Text>
          ) : null}

          <Button
            mode="outlined"
            icon="crosshairs-gps"
            onPress={handleCurrentLocation}
            loading={updateLocation.isPending}
            disabled={updateLocation.isPending || isOffline}
          >
            Użyj bieżącej lokalizacji
          </Button>

          <Text style={styles.label}>Motyw</Text>
          <SegmentedButtons
            value={themeMode}
            onValueChange={(value) => {
              const mode = value as ThemeMode;
              setThemeMode(mode);
              updateMe({ themeMode: mode }).catch((err) => {
                console.warn("Failed to sync themeMode to backend", err);
              });
            }}
            buttons={[
              { value: "light", label: "Jasny" },
              { value: "dark", label: "Ciemny" },
              { value: "system", label: "System" },
            ]}
          />
        </Card>

        {/* <Card title="Subskrypcja">
          <View style={styles.subscriptionRow}>
            <Text style={styles.label}>Aktualny plan</Text>
            <StatusBadge label="Starter" tone={planTone} />
          </View>
          <Button
            mode="outlined"
            onPress={() => setSnackbar("Integracja płatności wkrótce")}
          >
            Zarządzaj planem
          </Button>
        </Card> */}

        <Card title="Powiadomienia Push">
          <Text style={styles.preferenceDescription}>
            Powiadomienia przychodzące na telefon pomogą Ci być na bieżąco z
            ważnymi informacjami o Twoim ogrodzie, pogodzie i uprawach. Możesz
            dostosować, jakie alerty chcesz otrzymywać i o której godzinie.
          </Text>
          <View style={styles.preferenceRow}>
            <View style={styles.preferenceTextWrap}>
              <Text style={styles.preferenceTitle}>Włącz powiadomienia</Text>
              <Text style={styles.preferenceDescription}>
                Otrzymuj ważne informacje o pogodzie, uprawach i ogrodzie.
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={(value) => {
                void updateNotificationPreference({
                  notificationsEnabled: value,
                });
              }}
              disabled={preferencesQuery.isLoading}
            />
          </View>

          <View style={styles.preferenceRow}>
            <View style={styles.preferenceTextWrap}>
              <Text style={styles.preferenceTitle}>Codzienny plan dnia</Text>
              <Text style={styles.preferenceDescription}>
                Otrzymuj jedno powiadomienie z podsumowaniem zadań na dziś.
              </Text>
            </View>
            <Switch
              value={preferences?.advanced.dailySummaryEnabled ?? false}
              onValueChange={(value) => {
                void updateNotificationPreference({
                  advanced: {
                    dailySummaryEnabled: value,
                  },
                });
              }}
              disabled={!notificationsEnabled}
            />
          </View>

          <View style={styles.preferenceRow}>
            <View style={styles.preferenceTextWrap}>
              <Text style={styles.preferenceTitle}>Sugestie dla upraw</Text>
              <Text style={styles.preferenceDescription}>
                Otrzymuj powiadomienia o ważnych momentach, takich jak zbiory
                lub przesadzanie.
              </Text>
            </View>
            <Switch
              value={preferences?.advanced.lifecycleSuggestionsEnabled ?? false}
              onValueChange={(value) => {
                void updateNotificationPreference({
                  advanced: {
                    lifecycleSuggestionsEnabled: value,
                  },
                });
              }}
              disabled={!notificationsEnabled}
            />
          </View>

          <View style={styles.preferenceRow}>
            <View style={styles.preferenceTextWrap}>
              <Text style={styles.preferenceTitle}>Alerty pogodowe</Text>
              <Text style={styles.preferenceDescription}>
                Otrzymuj powiadomienia o pogodzie, która może wymagać szybkiej
                reakcji.
              </Text>
            </View>
            <Switch
              value={preferences?.advanced.weatherAlertsEnabled ?? false}
              onValueChange={(value) => {
                void updateNotificationPreference({
                  advanced: {
                    weatherAlertsEnabled: value,
                  },
                });
              }}
              disabled={!notificationsEnabled}
            />
          </View>

          <View style={styles.preferenceRow}>
            <View style={styles.preferenceTextWrap}>
              <Text style={styles.preferenceTitle}>Ryzyko dla ogrodu</Text>
              <Text style={styles.preferenceDescription}>
                Otrzymuj informacje o podwyższonym ryzyku dla upraw, np.
                przesuszeniu.
              </Text>
            </View>
            <Switch
              value={preferences?.advanced.gardenRiskEnabled ?? false}
              onValueChange={(value) => {
                void updateNotificationPreference({
                  advanced: {
                    gardenRiskEnabled: value,
                  },
                });
              }}
              disabled={!notificationsEnabled}
            />
          </View>

          <View style={styles.preferenceRow}>
            <View style={styles.preferenceTextWrap}>
              <Text style={styles.preferenceTitle}>Zmiany pogody</Text>
              <Text style={styles.preferenceDescription}>
                Otrzymuj informacje o istotnych zmianach statusu pogody.
              </Text>
            </View>
            <Switch
              value={preferences?.advanced.weatherStatusEnabled ?? false}
              onValueChange={(value) => {
                void updateNotificationPreference({
                  advanced: {
                    weatherStatusEnabled: value,
                  },
                });
              }}
              disabled={!notificationsEnabled}
            />
          </View>

          <View style={styles.preferenceRow}>
            <View style={styles.preferenceTextWrap}>
              <Text style={styles.preferenceTitle}>Nowe artykuły</Text>
              <Text style={styles.preferenceDescription}>
                Otrzymuj powiadomienia, gdy w bibliotece pojawi się nowy
                artykuł.
              </Text>
            </View>
            <Switch
              value={preferences?.advanced.recommendedArticlesEnabled ?? false}
              onValueChange={(value) => {
                void updateNotificationPreference({
                  advanced: {
                    recommendedArticlesEnabled: value,
                  },
                });
              }}
              disabled={!notificationsEnabled}
            />
          </View>

          <View style={styles.preferenceRow}>
            <View style={styles.preferenceTextWrap}>
              <Text style={styles.preferenceTitle}>
                Tygodniowe podsumowanie
              </Text>
              <Text style={styles.preferenceDescription}>
                Otrzymuj tygodniowe podsumowanie aktywności w ogrodzie.
              </Text>
            </View>
            <Switch
              value={preferences?.advanced.weeklyDigestEnabled ?? false}
              onValueChange={(value) => {
                void updateNotificationPreference({
                  advanced: {
                    weeklyDigestEnabled: value,
                  },
                });
              }}
              disabled={!notificationsEnabled}
            />
          </View>

          <Text style={styles.label}>Godzina codziennych przypomnień</Text>
          <Text style={styles.helper}>
            O tej godzinie wyślemy plan dnia i spokojne podsumowania. Ważne
            alerty pogodowe mogą przyjść od razu.
          </Text>
          <View style={styles.hourRow}>
            <Button
              mode="outlined"
              onPress={decrementNotificationHour}
              disabled={!notificationsEnabled}
            >
              -
            </Button>
            <Text style={styles.hourText}>
              {String(preferences?.notificationHour ?? 8).padStart(2, "0")}:00
            </Text>
            <Button
              mode="outlined"
              onPress={incrementNotificationHour}
              disabled={!notificationsEnabled}
            >
              +
            </Button>
          </View>

          {/* {isPushDiagnosticsVisible() ? (
            <Button
              mode="outlined"
              icon="bug-outline"
              onPress={() => router.push("/(tabs)/profile/push-diagnostics")}
            >
              Otwórz diagnostykę push
            </Button>
          ) : null} */}
        </Card>

        <Card title="Tutoriale">
          <View style={styles.preferenceRow}>
            <View style={styles.preferenceTextWrap}>
              <Text style={styles.preferenceTitle}>Pokazuj tutoriale</Text>
              <Text style={styles.preferenceDescription}>
                Wyświetlaj podpowiedzi przy pierwszym wejściu na ekran.
              </Text>
            </View>
            <Switch
              value={tutorials.enabled}
              onValueChange={(value) => {
                setTutorials({ enabled: value });
              }}
            />
          </View>

          <View style={styles.preferenceRow}>
            <View style={styles.preferenceTextWrap}>
              <Text style={styles.preferenceTitle}>Ekran główny</Text>
              <Text style={styles.preferenceDescription}>
                Obejrzyj tutorial ekranu głównego ponownie.
              </Text>
            </View>
            <Button
              compact
              mode="outlined"
              disabled={!tutorials.enabled}
              onPress={() => {
                setTutorials({ homeSeen: false });
                router.navigate("/(tabs)/home");
              }}
            >
              Powtórz
            </Button>
          </View>
        </Card>

        <Card title="Dane">
          <Divider />
          {/* <Button
            mode="contained"
            buttonColor={theme.colors.backdrop}
            onPress={() => router.push("/(tabs)/home/export-data")}
          >
            Eksport danych
          </Button> */}
          <Button mode="contained" onPress={handleSignOut}>
            Wyloguj
          </Button>
          <Button
            mode="contained"
            buttonColor={theme.colors.error}
            onPress={() => router.push("/(tabs)/home/delete-account")}
          >
            Usuń konto
          </Button>
        </Card>
      </ScrollView>
      <Snackbar visible={Boolean(snackbar)} onDismiss={() => setSnackbar(null)}>
        {snackbar}
      </Snackbar>
    </Screen>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      padding: spacing.md,
      paddingBottom: spacing.xl,
      gap: spacing.md,
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: theme.colors.onBackground,
      marginBottom: spacing.xs,
    },
    userRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    userMeta: {
      flex: 1,
      gap: 2,
    },
    userName: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    userEmail: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    label: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      fontWeight: "600",
      marginBottom: spacing.sm,
      marginTop: spacing.xs,
    },
    helper: {
      marginTop: spacing.xs,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    locationInput: {
      marginTop: spacing.xs,
      marginBottom: spacing.xs,
      backgroundColor: theme.colors.surface,
    },
    results: {
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: radius.md,
      overflow: "hidden",
      marginBottom: spacing.xs,
    },
    resultItem: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
    },
    resultText: {
      fontSize: 13,
      color: theme.colors.onSurface,
    },
    inlineWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    chip: {
      borderRadius: radius.pill,
    },
    unitsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    subscriptionRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.sm,
    },
    preferenceRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: spacing.sm,
      gap: spacing.sm,
    },
    preferenceTextWrap: {
      flex: 1,
      gap: 4,
      paddingTop: 2,
    },
    preferenceTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    preferenceDescription: {
      fontSize: 12,
      lineHeight: 17,
      color: theme.colors.onSurfaceVariant,
    },
    hourRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    hourText: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.colors.onSurface,
      minWidth: 64,
      textAlign: "center",
    },
  });
