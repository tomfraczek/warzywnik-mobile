import { getResponseError } from "@/src/api/axios";
import { useDisableDevice } from "@/src/api/queries/devices/useDisableDevice";
import { useRegisterDevice } from "@/src/api/queries/devices/useRegisterDevice";
import { GeoSearchItem } from "@/src/api/queries/geo/types";
import { useGeoReverse } from "@/src/api/queries/geo/useGeoReverse";
import { useGeoSearch } from "@/src/api/queries/geo/useGeoSearch";
import { useUpdateUserLocation } from "@/src/api/queries/geo/useUpdateUserLocation";
import { clientPersister, queryClient } from "@/src/api/queryClient";
import { Screen } from "@/src/components/Screen";
import { getAvatarSource } from "@/src/constants/avatars";
import { OFFLINE_MUTATION_MESSAGE } from "@/src/features/network/offline";
import { useIsOffline } from "@/src/hooks/useNetworkStatus";
import {
  AreaUnit,
  LanguagePreference,
  PrecipitationUnit,
  StoredLocation,
  TemperatureUnit,
  ThemeMode,
  useSettings,
} from "@/src/context/SettingsProvider";
import { getExpoToken, requestPermission } from "@/src/features/push/push";
import { useClerk, useUser } from "@clerk/clerk-expo";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
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
  Icon,
  MD3Theme,
  Menu,
  SegmentedButtons,
  Snackbar,
  Surface,
  Switch,
  TextInput,
  useTheme,
} from "react-native-paper";

type PendingDeviceLocation = {
  lat: number;
  lon: number;
  accuracyM?: number;
};

export default function HomeSettingsScreen() {
  const router = useRouter();
  const { signOut } = useClerk();
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const {
    themeMode,
    setThemeMode,
    languagePreference,
    setLanguagePreference,
    location,
    setLocationPreference,
    units,
    setUnits,
    profile,
    pushNotifications,
    setPushNotifications,
  } = useSettings();
  const { user, isLoaded } = useUser();
  const [locationQuery, setLocationQuery] = useState(location?.label ?? "");
  const [debouncedLocationQuery, setDebouncedLocationQuery] = useState(
    location?.label ?? "",
  );
  const [pendingDeviceLocation, setPendingDeviceLocation] =
    useState<PendingDeviceLocation | null>(null);
  const [languageMenuVisible, setLanguageMenuVisible] = useState(false);
  const [selectedLocationLabel, setSelectedLocationLabel] = useState<
    string | null
  >(location?.label ?? null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationPermissionDenied, setLocationPermissionDenied] =
    useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [isPushSaving, setIsPushSaving] = useState(false);
  const [pushPermissionDenied, setPushPermissionDenied] = useState(false);
  const registerDevice = useRegisterDevice();
  const disableDevice = useDisableDevice();
  const updateLocationPreference = useUpdateUserLocation();
  const emailLabel =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    (isLoaded ? "Brak emaila" : "Ładowanie...");
  const languageLabelMap: Record<LanguagePreference, string> = {
    system: "Systemowy",
    pl: "Polski",
    en: "Angielski",
  };
  const geoLanguage =
    languagePreference === "system" ? undefined : languagePreference;
  const trimmedDebouncedLocationQuery = debouncedLocationQuery.trim();
  const shouldSearchManualLocation =
    trimmedDebouncedLocationQuery.length >= 3 &&
    (!selectedLocationLabel ||
      trimmedDebouncedLocationQuery !== selectedLocationLabel);

  const geoSearchQuery = useGeoSearch(
    trimmedDebouncedLocationQuery,
    geoLanguage,
    {
      enabled: shouldSearchManualLocation,
    },
  );
  const geoReverseQuery = useGeoReverse(
    pendingDeviceLocation?.lat ?? null,
    pendingDeviceLocation?.lon ?? null,
    geoLanguage,
    { enabled: pendingDeviceLocation !== null },
  );

  const locationResults = shouldSearchManualLocation
    ? (geoSearchQuery.data ?? [])
    : [];
  const isSearching = shouldSearchManualLocation && geoSearchQuery.isFetching;
  const isSavingLocation = updateLocationPreference.isPending;

  useEffect(() => {
    if (!location?.label) return;
    setLocationQuery(location.label);
    setDebouncedLocationQuery(location.label);
    setSelectedLocationLabel(location.label);
  }, [location?.label, location?.mode]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedLocationQuery(locationQuery);
    }, 400);

    return () => clearTimeout(timeout);
  }, [locationQuery]);

  useEffect(() => {
    if (!geoSearchQuery.isError) return;
    console.error("Location search failed", geoSearchQuery.error);
    setLocationError("Nie udało się wyszukać lokalizacji.");
  }, [geoSearchQuery.error, geoSearchQuery.isError]);

  const isOffline = useIsOffline();

  const handleSelectLocation = useCallback(
    async (result: GeoSearchItem) => {
      if (isOffline) {
        Alert.alert("Tryb offline", OFFLINE_MUTATION_MESSAGE);
        return;
      }
      setLocationError(null);
      setLocationPermissionDenied(false);
      try {
        await updateLocationPreference.mutateAsync({
          mode: "MANUAL",
          label: result.label,
          lat: result.lat,
          lon: result.lon,
          providerPlaceId: result.placeId,
        });

        const nextLocation: StoredLocation = {
          label: result.label,
          lat: result.lat,
          lon: result.lon,
          mode: "MANUAL",
          updatedAt: Date.now(),
          providerPlaceId: result.placeId,
        };

        setLocationQuery(result.label);
        setDebouncedLocationQuery(result.label);
        setSelectedLocationLabel(result.label);
        setLocationPreference(nextLocation);
      } catch (error) {
        console.error("Saving manual location failed", error);
        setLocationError(
          `Nie udało się zapisać lokalizacji. ${getResponseError(error)}`,
        );
      }
    },
    [setLocationPreference, updateLocationPreference],
  );

  const handleUseCurrentLocation = useCallback(async () => {
    if (isOffline) {
      Alert.alert("Tryb offline", OFFLINE_MUTATION_MESSAGE);
      return;
    }
    setIsLocating(true);
    setLocationError(null);
    setLocationPermissionDenied(false);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationError("Brak uprawnień do lokalizacji.");
        setLocationPermissionDenied(true);
        setIsLocating(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = position.coords;
      setPendingDeviceLocation({
        lat: latitude,
        lon: longitude,
        accuracyM:
          typeof position.coords.accuracy === "number"
            ? position.coords.accuracy
            : undefined,
      });
    } catch (error) {
      console.error("Using current location failed", error);
      setLocationError("Nie udało się pobrać lokalizacji.");
      setIsLocating(false);
    }
  }, []);

  useEffect(() => {
    if (!pendingDeviceLocation) return;

    if (geoReverseQuery.isError) {
      console.error("Reverse geocoding failed", geoReverseQuery.error);
      setLocationError("Nie udało się pobrać lokalizacji.");
      setPendingDeviceLocation(null);
      setIsLocating(false);
      return;
    }

    if (!geoReverseQuery.data) return;

    const request = pendingDeviceLocation;
    const label =
      geoReverseQuery.data.label ||
      `${request.lat.toFixed(4)}, ${request.lon.toFixed(4)}`;
    setPendingDeviceLocation(null);

    let active = true;
    void (async () => {
      try {
        await updateLocationPreference.mutateAsync({
          mode: "DEVICE",
          label,
          lat: request.lat,
          lon: request.lon,
          accuracyM: request.accuracyM,
        });

        if (!active) return;

        const nextLocation: StoredLocation = {
          label,
          lat: request.lat,
          lon: request.lon,
          mode: "DEVICE",
          updatedAt: Date.now(),
          accuracyM: request.accuracyM,
        };

        setLocationQuery(label);
        setDebouncedLocationQuery(label);
        setSelectedLocationLabel(label);
        setLocationError(null);
        setLocationPermissionDenied(false);
        setLocationPreference(nextLocation);
      } catch (error) {
        console.error("Saving device location failed", error);
        if (!active) return;
        setLocationError(
          `Nie udało się zapisać lokalizacji. ${getResponseError(error)}`,
        );
      } finally {
        if (active) {
          setIsLocating(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [
    geoReverseQuery.data,
    geoReverseQuery.error,
    geoReverseQuery.isError,
    pendingDeviceLocation,
    setLocationPreference,
    updateLocationPreference,
  ]);

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

  const handleSubscriptionPlaceholder = useCallback(() => {
    setSnackbarMessage("Wkrótce");
  }, []);

  const handleOpenSettings = useCallback(() => {
    Linking.openSettings().catch(() => {
      setSnackbarMessage("Nie udało się otworzyć ustawień urządzenia.");
    });
  }, []);

  const handleTogglePush = useCallback(
    async (nextValue: boolean) => {
      if (isOffline) {
        Alert.alert("Tryb offline", OFFLINE_MUTATION_MESSAGE);
        return;
      }
      if (isPushSaving) return;
      setIsPushSaving(true);

      try {
        if (nextValue) {
          const permission = await requestPermission();
          if (!permission.granted) {
            setPushPermissionDenied(true);
            setPushNotifications({ enabled: false, deviceId: null });
            setSnackbarMessage(
              "Brak zgody na powiadomienia. Włącz je w ustawieniach systemu.",
            );
            return;
          }

          setPushPermissionDenied(false);

          const expoPushToken = await getExpoToken();
          const device = await registerDevice.mutateAsync({
            expoPushToken,
            platform: Platform.OS,
          });
          setPushNotifications({
            enabled: true,
            deviceId: device.id ?? null,
          });
          setSnackbarMessage("Powiadomienia włączone.");
          return;
        }

        if (pushNotifications.deviceId) {
          await disableDevice.mutateAsync({
            deviceId: pushNotifications.deviceId,
          });
        }
        setPushNotifications({ enabled: false, deviceId: null });
        setSnackbarMessage("Powiadomienia wyłączone.");
      } catch (error) {
        console.error("Push notifications toggle failed", error);
        setPushNotifications({ enabled: pushNotifications.enabled });
        setSnackbarMessage("Nie udało się zaktualizować powiadomień.");
      } finally {
        setIsPushSaving(false);
      }
    },
    [
      disableDevice,
      isPushSaving,
      pushNotifications.deviceId,
      pushNotifications.enabled,
      registerDevice,
      setPushNotifications,
    ],
  );

  const avatarSource = getAvatarSource(profile.avatarId);
  const profileName = profile.name.trim() || "Nie ustawiono";
  const profileFields = [
    { label: "Imię", value: profileName },
    { label: "Email", value: emailLabel },
  ];

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
              {avatarSource ? (
                <Avatar.Image
                  size={84}
                  source={avatarSource}
                  style={styles.avatarImage}
                />
              ) : (
                <Avatar.Icon size={84} icon="account" style={styles.avatar} />
              )}
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
                setLocationError(null);
                setLocationPermissionDenied(false);
              }}
              placeholder="Wpisz miasto, ulicę lub adres"
              style={styles.locationInput}
            />
            {location?.mode === "DEVICE" ? (
              <Text style={styles.emptyHint}>
                Ustawiono na podstawie lokalizacji urządzenia
              </Text>
            ) : null}
            {location?.mode === "MANUAL" ? (
              <Text style={styles.emptyHint}>Ustawiono ręcznie</Text>
            ) : null}
            <Button
              mode="outlined"
              icon="crosshairs-gps"
              onPress={handleUseCurrentLocation}
              loading={isLocating}
              disabled={isLocating || isSavingLocation || isOffline}
              style={styles.locationButton}
            >
              Użyj bieżącej lokalizacji
            </Button>

            {locationError ? (
              <Text style={styles.errorText}>{locationError}</Text>
            ) : null}

            {locationPermissionDenied ? (
              <Button
                mode="text"
                onPress={handleOpenSettings}
                style={styles.inlineAction}
              >
                Otwórz ustawienia
              </Button>
            ) : null}

            {locationResults.length > 0 ? (
              <Surface style={styles.results} elevation={0}>
                {locationResults.map((result) => (
                  <Pressable
                    key={result.placeId}
                    onPress={() => handleSelectLocation(result)}
                    style={styles.resultItem}
                    disabled={isSavingLocation || isOffline}
                  >
                    <Text style={styles.resultText}>{result.label}</Text>
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
            <Text style={styles.sectionSubtitle}>Temperatura</Text>
            <SegmentedButtons
              value={units.temperature}
              onValueChange={(value) =>
                setUnits({ temperature: value as TemperatureUnit })
              }
              buttons={[
                { value: "celsius", label: "°C" },
                { value: "fahrenheit", label: "°F" },
              ]}
              style={styles.segmentedButtons}
            />
            <Text style={[styles.sectionSubtitle, styles.unitSpacing]}>
              Opady
            </Text>
            <SegmentedButtons
              value={units.precipitation}
              onValueChange={(value) =>
                setUnits({ precipitation: value as PrecipitationUnit })
              }
              buttons={[
                { value: "mm", label: "mm" },
                { value: "in", label: "in" },
              ]}
              style={styles.segmentedButtons}
            />
            <Text style={[styles.sectionSubtitle, styles.unitSpacing]}>
              Powierzchnia
            </Text>
            <SegmentedButtons
              value={units.area}
              onValueChange={(value) => setUnits({ area: value as AreaUnit })}
              buttons={[
                { value: "m2", label: "m²" },
                { value: "ft2", label: "ft²" },
              ]}
              style={styles.segmentedButtons}
            />
          </Surface>
          <Surface style={styles.section} elevation={0}>
            <Text style={styles.sectionTitle}>Subskrypcja</Text>
            <Pressable
              onPress={handleSubscriptionPlaceholder}
              style={styles.row}
            >
              <Text style={styles.rowLabel}>Plan</Text>
              <View style={styles.rowValue}>
                <Text style={styles.rowValueText}>Free</Text>
                <Icon
                  source="chevron-right"
                  size={20}
                  color={theme.colors.onSurfaceVariant}
                />
              </View>
            </Pressable>
            <Divider style={styles.rowDivider} />
            <Pressable
              onPress={handleSubscriptionPlaceholder}
              style={styles.row}
            >
              <Text style={styles.rowLabel}>Status</Text>
              <View style={styles.rowValue}>
                <Text style={styles.rowValueText}>Aktywny</Text>
                <Icon
                  source="chevron-right"
                  size={20}
                  color={theme.colors.onSurfaceVariant}
                />
              </View>
            </Pressable>
            <Button
              mode="outlined"
              onPress={handleSubscriptionPlaceholder}
              style={styles.subscriptionButton}
            >
              Zarządzaj subskrypcją
            </Button>
          </Surface>

          <Surface style={styles.section} elevation={0}>
            <Text style={styles.sectionTitle}>Powiadomienia</Text>
            <Text style={styles.sectionSubtitle}>
              Otrzymuj przypomnienia o zadaniach i zdrowiu upraw.
            </Text>
            <View
              style={styles.row}
              accessibilityRole="switch"
              accessibilityState={{ checked: pushNotifications.enabled }}
            >
              <Text style={styles.rowLabel}>Powiadomienia push</Text>
              <Switch
                value={pushNotifications.enabled}
                onValueChange={handleTogglePush}
                disabled={isPushSaving || isOffline}
              />
            </View>
            {pushPermissionDenied ? (
              <Button
                mode="text"
                onPress={handleOpenSettings}
                style={styles.inlineAction}
              >
                Otwórz ustawienia systemu
              </Button>
            ) : null}
          </Surface>

          <Surface style={styles.section} elevation={0}>
            <Text style={styles.sectionTitle}>Dane</Text>
            <Pressable
              onPress={() => router.push("/(tabs)/home/reminders")}
              style={styles.row}
            >
              <Text style={styles.rowLabel}>Zadania</Text>
              <Icon
                source="chevron-right"
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
            </Pressable>
            <Divider style={styles.rowDivider} />
            <Pressable
              onPress={() => router.push("/(tabs)/home/export-data")}
              style={styles.row}
            >
              <Text style={styles.rowLabel}>Eksport danych</Text>
              <Icon
                source="chevron-right"
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
            </Pressable>
            <Divider style={styles.rowDivider} />
            <Pressable
              onPress={() => router.push("/(tabs)/home/delete-account")}
              style={styles.row}
            >
              <Text style={styles.rowLabel}>Usuń konto</Text>
              <Icon
                source="chevron-right"
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
            </Pressable>
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
      <Snackbar
        visible={!!snackbarMessage}
        onDismiss={() => setSnackbarMessage(null)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
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
    avatarImage: {
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
    unitSpacing: {
      marginTop: 12,
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
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 10,
    },
    rowLabel: {
      fontSize: 13,
      color: theme.colors.onSurface,
      fontWeight: "500",
    },
    rowValue: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    rowValueText: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    rowDivider: {
      backgroundColor: theme.colors.outline,
      height: StyleSheet.hairlineWidth,
    },
    subscriptionButton: {
      marginTop: 12,
      alignSelf: "flex-start",
    },
    inlineAction: {
      alignSelf: "flex-start",
      paddingHorizontal: 0,
      marginTop: 4,
    },
    signOutButton: {
      marginTop: 16,
      borderRadius: 12,
    },
  });
