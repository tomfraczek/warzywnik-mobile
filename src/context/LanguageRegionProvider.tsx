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

export type LanguagePreference = "system" | "pl" | "en";

type LanguageRegionContextValue = {
  languagePreference: LanguagePreference;
  setLanguagePreference: (value: LanguagePreference) => void;
  isReady: boolean;
};

const LANGUAGE_PREFERENCE_STORAGE_KEY = "languagePreference";

const LanguageRegionContext = createContext<
  LanguageRegionContextValue | undefined
>(undefined);

const isLanguagePreference = (
  value: string | null,
): value is LanguagePreference =>
  value === "system" || value === "pl" || value === "en";

export function LanguageRegionProvider({ children }: PropsWithChildren) {
  const [languagePreference, setLanguagePreferenceState] =
    useState<LanguagePreference>("system");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(LANGUAGE_PREFERENCE_STORAGE_KEY)
      .then((value) => {
        if (!active) return;
        if (isLanguagePreference(value)) {
          setLanguagePreferenceState(value);
        }
        setIsReady(true);
      })
      .catch((error) => {
        console.error("Failed to load language preference", error);
        if (!active) return;
        setIsReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const setLanguagePreference = useCallback((value: LanguagePreference) => {
    setLanguagePreferenceState(value);
    AsyncStorage.setItem(LANGUAGE_PREFERENCE_STORAGE_KEY, value).catch(
      (error) => {
        console.error("Failed to persist language preference", error);
      },
    );
  }, []);

  const value = useMemo(
    () => ({ languagePreference, setLanguagePreference, isReady }),
    [languagePreference, setLanguagePreference, isReady],
  );

  return (
    <LanguageRegionContext.Provider value={value}>
      {children}
    </LanguageRegionContext.Provider>
  );
}

export function useLanguageRegion() {
  const context = useContext(LanguageRegionContext);
  if (!context) {
    throw new Error(
      "useLanguageRegion must be used within LanguageRegionProvider",
    );
  }
  return context;
}
