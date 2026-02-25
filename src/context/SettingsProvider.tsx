import { AvatarId } from "@/src/constants/avatars";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ThemeMode = "light" | "dark" | "system";
export type LanguagePreference = "system" | "pl" | "en";
export type TemperatureUnit = "celsius" | "fahrenheit";
export type PrecipitationUnit = "mm" | "in";
export type AreaUnit = "m2" | "ft2";
export type LocationMode = "MANUAL" | "DEVICE";

export type UnitsSettings = {
  temperature: TemperatureUnit;
  precipitation: PrecipitationUnit;
  area: AreaUnit;
};

export type StoredLocation = {
  label: string;
  lat: number;
  lon: number;
  mode: LocationMode;
  updatedAt: number;
  accuracyM?: number;
  providerPlaceId?: string;
};

export type ProfileSettings = {
  name: string;
  avatarId: AvatarId | null;
};

export type PushNotificationsSettings = {
  enabled: boolean;
  deviceId: string | null;
};

export type AppSettings = {
  themeMode: ThemeMode;
  languagePreference: LanguagePreference;
  units: UnitsSettings;
  location: StoredLocation | null;
  profile: ProfileSettings;
  pushNotifications: PushNotificationsSettings;
};

type SettingsContextValue = AppSettings & {
  setThemeMode: (mode: ThemeMode) => void;
  setLanguagePreference: (value: LanguagePreference) => void;
  setUnits: (units: Partial<UnitsSettings>) => void;
  setLocationPreference: (location: StoredLocation | null) => void;
  setProfile: (profile: Partial<ProfileSettings>) => void;
  setPushNotifications: (patch: Partial<PushNotificationsSettings>) => void;
  isReady: boolean;
};

const SETTINGS_STORAGE_KEY = "appSettings";

const defaultSettings: AppSettings = {
  themeMode: "system",
  languagePreference: "system",
  units: {
    temperature: "celsius",
    precipitation: "mm",
    area: "m2",
  },
  location: null,
  profile: {
    name: "",
    avatarId: null,
  },
  pushNotifications: {
    enabled: false,
    deviceId: null,
  },
};

const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined,
);

const isThemeMode = (value: unknown): value is ThemeMode =>
  value === "light" || value === "dark" || value === "system";

const isLanguagePreference = (value: unknown): value is LanguagePreference =>
  value === "system" || value === "pl" || value === "en";

const isTemperatureUnit = (value: unknown): value is TemperatureUnit =>
  value === "celsius" || value === "fahrenheit";

const isPrecipitationUnit = (value: unknown): value is PrecipitationUnit =>
  value === "mm" || value === "in";

const isAreaUnit = (value: unknown): value is AreaUnit =>
  value === "m2" || value === "ft2";

const isLocationMode = (value: unknown): value is LocationMode =>
  value === "MANUAL" || value === "DEVICE";

const parseSettings = (raw: string | null): AppSettings => {
  if (!raw) return defaultSettings;

  try {
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    const locationCandidate = parsed.location as
      | (Partial<StoredLocation> & {
          label?: unknown;
          lat?: unknown;
          lon?: unknown;
          mode?: unknown;
          updatedAt?: unknown;
          accuracyM?: unknown;
          providerPlaceId?: unknown;
        })
      | null
      | undefined;
    const profileCandidate = parsed.profile as ProfileSettings | undefined;
    const unitsCandidate = parsed.units as UnitsSettings | undefined;
    const pushCandidate = parsed.pushNotifications as
      | PushNotificationsSettings
      | undefined;

    return {
      themeMode: isThemeMode(parsed.themeMode)
        ? parsed.themeMode
        : defaultSettings.themeMode,
      languagePreference: isLanguagePreference(parsed.languagePreference)
        ? parsed.languagePreference
        : defaultSettings.languagePreference,
      units: {
        temperature: isTemperatureUnit(unitsCandidate?.temperature)
          ? unitsCandidate.temperature
          : defaultSettings.units.temperature,
        precipitation: isPrecipitationUnit(unitsCandidate?.precipitation)
          ? unitsCandidate.precipitation
          : defaultSettings.units.precipitation,
        area: isAreaUnit(unitsCandidate?.area)
          ? unitsCandidate.area
          : defaultSettings.units.area,
      },
      location:
        locationCandidate &&
        typeof locationCandidate.label === "string" &&
        typeof locationCandidate.lat === "number" &&
        typeof locationCandidate.lon === "number"
          ? {
              label: locationCandidate.label,
              lat: locationCandidate.lat,
              lon: locationCandidate.lon,
              mode: isLocationMode(locationCandidate.mode)
                ? locationCandidate.mode
                : "MANUAL",
              updatedAt:
                typeof locationCandidate.updatedAt === "number" &&
                Number.isFinite(locationCandidate.updatedAt)
                  ? locationCandidate.updatedAt
                  : Date.now(),
              accuracyM:
                typeof locationCandidate.accuracyM === "number" &&
                Number.isFinite(locationCandidate.accuracyM)
                  ? locationCandidate.accuracyM
                  : undefined,
              providerPlaceId:
                typeof locationCandidate.providerPlaceId === "string"
                  ? locationCandidate.providerPlaceId
                  : undefined,
            }
          : null,
      profile: {
        name:
          typeof profileCandidate?.name === "string"
            ? profileCandidate.name
            : defaultSettings.profile.name,
        avatarId:
          typeof profileCandidate?.avatarId === "string"
            ? (profileCandidate.avatarId as AvatarId)
            : defaultSettings.profile.avatarId,
      },
      pushNotifications: {
        enabled:
          typeof pushCandidate?.enabled === "boolean"
            ? pushCandidate.enabled
            : defaultSettings.pushNotifications.enabled,
        deviceId:
          typeof pushCandidate?.deviceId === "string"
            ? pushCandidate.deviceId
            : defaultSettings.pushNotifications.deviceId,
      },
    };
  } catch (error) {
    console.error("Failed to parse app settings", error);
    return defaultSettings;
  }
};

export function SettingsProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isReady, setIsReady] = useState(false);

  const persistSettings = useCallback(async (nextSettings: AppSettings) => {
    try {
      await AsyncStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(nextSettings),
      );
    } catch (error) {
      console.error("Failed to persist app settings", error);
    }
  }, []);

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(SETTINGS_STORAGE_KEY)
      .then((value) => {
        if (!active) return;
        const parsed = parseSettings(value);
        setSettings(parsed);
        setIsReady(true);
      })
      .catch((error) => {
        console.error("Failed to load app settings", error);
        if (!active) return;
        setIsReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const updateSettings = useCallback(
    (updater: (prev: AppSettings) => AppSettings) => {
      setSettings((prev) => {
        const next = updater(prev);
        persistSettings(next);
        return next;
      });
    },
    [persistSettings],
  );

  const setThemeMode = useCallback(
    (mode: ThemeMode) => {
      updateSettings((prev) => ({ ...prev, themeMode: mode }));
    },
    [updateSettings],
  );

  const setLanguagePreference = useCallback(
    (value: LanguagePreference) => {
      updateSettings((prev) => ({ ...prev, languagePreference: value }));
    },
    [updateSettings],
  );

  const setUnits = useCallback(
    (units: Partial<UnitsSettings>) => {
      updateSettings((prev) => ({
        ...prev,
        units: {
          ...prev.units,
          ...units,
        },
      }));
    },
    [updateSettings],
  );

  const setLocationPreference = useCallback(
    (location: StoredLocation | null) => {
      updateSettings((prev) => ({ ...prev, location }));
    },
    [updateSettings],
  );

  const setProfile = useCallback(
    (profile: Partial<ProfileSettings>) => {
      updateSettings((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          ...profile,
        },
      }));
    },
    [updateSettings],
  );

  const setPushNotifications = useCallback(
    (patch: Partial<PushNotificationsSettings>) => {
      updateSettings((prev) => ({
        ...prev,
        pushNotifications: {
          ...prev.pushNotifications,
          ...patch,
        },
      }));
    },
    [updateSettings],
  );

  const value = useMemo(
    () => ({
      ...settings,
      setThemeMode,
      setLanguagePreference,
      setUnits,
      setLocationPreference,
      setProfile,
      setPushNotifications,
      isReady,
    }),
    [
      settings,
      setThemeMode,
      setLanguagePreference,
      setUnits,
      setLocationPreference,
      setProfile,
      setPushNotifications,
      isReady,
    ],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
}
