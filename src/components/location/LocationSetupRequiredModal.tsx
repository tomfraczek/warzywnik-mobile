import { restClient } from "@/src/api/axios";
import { GeoSearchItem } from "@/src/api/queries/geo/types";
import { useGeoSearch } from "@/src/api/queries/geo/useGeoSearch";
import { useUpdateUserLocation } from "@/src/api/queries/geo/useUpdateUserLocation";
import {
  LocationMode,
  StoredLocation,
  useSettings,
} from "@/src/context/SettingsProvider";
import { OFFLINE_MUTATION_MESSAGE } from "@/src/features/network/offline";
import { useIsOffline } from "@/src/hooks/useNetworkStatus";
import { radius, spacing } from "@/src/theme/ui";
import { useAuth } from "@clerk/clerk-expo";
import { isAxiosError } from "axios";
import * as Location from "expo-location";
import { usePathname, useSegments } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import {
  Button,
  MD3Theme,
  Modal,
  Portal,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

type WeatherLocationResponse = {
  location?: {
    label: string;
    lat: number;
    lon: number;
  };
};

const hasValidLocation = (location: unknown): location is { label: string } => {
  if (!location || typeof location !== "object") return false;
  const candidate = location as Record<string, unknown>;
  return (
    typeof candidate.label === "string" && candidate.label.trim().length > 0
  );
};

export function LocationSetupRequiredModal() {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const { isLoaded, isSignedIn } = useAuth();
  const { location, setLocationPreference, languagePreference } = useSettings();
  const segments = useSegments();
  const pathname = usePathname();
  const isOffline = useIsOffline();
  const updateLocation = useUpdateUserLocation();

  const [visible, setVisible] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [locationQuery, setLocationQuery] = useState(location?.label ?? "");
  const [debouncedLocationQuery, setDebouncedLocationQuery] = useState(
    location?.label ?? "",
  );
  const [selectedLocationLabel, setSelectedLocationLabel] = useState<
    string | null
  >(location?.label ?? null);

  const hasCheckedRef = useRef(false);

  const inAuthGroup = segments[0] === "(auth)";
  const shouldRunCheck =
    isLoaded &&
    isSignedIn &&
    !inAuthGroup &&
    pathname !== "/(auth)" &&
    pathname !== "/";

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

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedLocationQuery(locationQuery);
    }, 400);

    return () => clearTimeout(timeout);
  }, [locationQuery]);

  useEffect(() => {
    if (!location?.label) return;
    setLocationQuery(location.label);
    setDebouncedLocationQuery(location.label);
    setSelectedLocationLabel(location.label);
  }, [location?.label]);

  useEffect(() => {
    if (!isSignedIn) {
      hasCheckedRef.current = false;
      setVisible(false);
    }
  }, [isSignedIn]);

  const applyLocationLocally = useCallback(
    (payload: {
      label: string;
      lat: number;
      lon: number;
      mode: LocationMode;
      providerPlaceId?: string;
      accuracyM?: number;
    }) => {
      const nextLocation: StoredLocation = {
        label: payload.label,
        lat: payload.lat,
        lon: payload.lon,
        mode: payload.mode,
        updatedAt: Date.now(),
        providerPlaceId: payload.providerPlaceId,
        accuracyM: payload.accuracyM,
      };
      setLocationPreference(nextLocation);
      setLocationQuery(payload.label);
      setDebouncedLocationQuery(payload.label);
      setSelectedLocationLabel(payload.label);
    },
    [setLocationPreference],
  );

  const checkServerLocation = useCallback(async () => {
    if (!shouldRunCheck || hasCheckedRef.current || isOffline) return;

    hasCheckedRef.current = true;
    setIsChecking(true);
    setErrorMessage(null);

    try {
      const { data } =
        await restClient.get<WeatherLocationResponse>("/users/me/weather");

      if (hasValidLocation(data?.location)) {
        const serverLocation = data.location;
        applyLocationLocally({
          label: serverLocation.label,
          lat: serverLocation.lat,
          lon: serverLocation.lon,
          mode: location?.mode ?? "MANUAL",
        });
        setVisible(false);
        return;
      }

      setVisible(true);
    } catch (error) {
      if (isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 404 || status === 422) {
          setVisible(true);
          return;
        }
      }
    } finally {
      setIsChecking(false);
    }
  }, [applyLocationLocally, isOffline, location?.mode, shouldRunCheck]);

  useEffect(() => {
    void checkServerLocation();
  }, [checkServerLocation]);

  const saveManualLocation = useCallback(
    async (result: GeoSearchItem) => {
      if (isOffline) {
        Alert.alert("Tryb offline", OFFLINE_MUTATION_MESSAGE);
        return;
      }

      setErrorMessage(null);
      try {
        await updateLocation.mutateAsync({
          mode: "MANUAL",
          label: result.label,
          lat: result.lat,
          lon: result.lon,
          providerPlaceId: result.placeId,
        });

        applyLocationLocally({
          label: result.label,
          lat: result.lat,
          lon: result.lon,
          mode: "MANUAL",
          providerPlaceId: result.placeId,
        });
        setVisible(false);
      } catch {
        setErrorMessage("Nie udało się zapisać lokalizacji.");
      }
    },
    [applyLocationLocally, isOffline, updateLocation],
  );

  const saveCurrentLocation = useCallback(async () => {
    if (isOffline) {
      Alert.alert("Tryb offline", OFFLINE_MUTATION_MESSAGE);
      return;
    }

    setErrorMessage(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMessage("Brak uprawnień do lokalizacji.");
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
        accuracyM:
          typeof position.coords.accuracy === "number"
            ? position.coords.accuracy
            : undefined,
      });

      applyLocationLocally({
        label,
        lat,
        lon,
        mode: "DEVICE",
        accuracyM:
          typeof position.coords.accuracy === "number"
            ? position.coords.accuracy
            : undefined,
      });
      setVisible(false);
    } catch {
      setErrorMessage("Nie udało się pobrać lokalizacji.");
    }
  }, [applyLocationLocally, isOffline, updateLocation]);

  const isBusy = isChecking || updateLocation.isPending;
  const shouldShow = useMemo(
    () => shouldRunCheck && visible,
    [shouldRunCheck, visible],
  );

  if (!shouldRunCheck) return null;

  return (
    <Portal>
      <Modal
        visible={shouldShow}
        dismissable={false}
        contentContainerStyle={styles.modalContent}
      >
        <Text style={styles.title}>Ustaw lokalizację</Text>
        <Text style={styles.description}>
          Nie znaleziono zapisanej lokalizacji na serwerze. Ustaw ją, aby
          pobierać pogodę i ostrzeżenia.
        </Text>

        <TextInput
          mode="outlined"
          value={locationQuery}
          onChangeText={(value) => {
            setLocationQuery(value);
            setSelectedLocationLabel(null);
            setErrorMessage(null);
          }}
          placeholder="Wpisz miasto, ulicę lub adres"
          style={styles.locationInput}
          left={<TextInput.Icon icon="map-marker" />}
          disabled={isBusy || isOffline}
        />

        {locationResults.length > 0 ? (
          <View style={styles.results}>
            {locationResults.map((result) => (
              <Pressable
                key={result.placeId}
                onPress={() => saveManualLocation(result)}
                style={styles.resultItem}
                disabled={isBusy || isOffline}
              >
                <Text style={styles.resultText}>{result.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {locationResults.length === 0 &&
        locationQuery.trim().length >= 3 &&
        !geoSearchQuery.isFetching &&
        !selectedLocationLabel ? (
          <Text style={styles.helper}>Brak wyników.</Text>
        ) : null}

        <Button
          mode="outlined"
          icon="crosshairs-gps"
          onPress={saveCurrentLocation}
          loading={isBusy}
          disabled={isBusy || isOffline}
        >
          Użyj bieżącej lokalizacji
        </Button>

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}
      </Modal>
    </Portal>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    modalContent: {
      marginHorizontal: spacing.md,
      borderRadius: radius.lg,
      padding: spacing.md,
      backgroundColor: theme.colors.surface,
      gap: spacing.sm,
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    description: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    locationInput: {
      marginTop: spacing.xs,
      backgroundColor: theme.colors.surface,
    },
    results: {
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: radius.md,
      overflow: "hidden",
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
    helper: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    errorText: {
      fontSize: 12,
      color: theme.colors.error,
    },
  });
