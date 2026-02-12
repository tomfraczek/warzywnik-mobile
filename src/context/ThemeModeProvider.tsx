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

type ThemeModeContextValue = {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isReady: boolean;
};

const THEME_MODE_STORAGE_KEY = "themeMode";

const ThemeModeContext = createContext<ThemeModeContextValue | undefined>(
  undefined,
);

const isThemeMode = (value: string | null): value is ThemeMode =>
  value === "light" || value === "dark" || value === "system";

export function ThemeModeProvider({ children }: PropsWithChildren) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(THEME_MODE_STORAGE_KEY)
      .then((value) => {
        if (!active) return;
        if (isThemeMode(value)) {
          setThemeModeState(value);
        }
        setIsReady(true);
      })
      .catch((error) => {
        console.error("Failed to load theme mode", error);
        if (!active) return;
        setIsReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem(THEME_MODE_STORAGE_KEY, mode).catch((error) => {
      console.error("Failed to persist theme mode", error);
    });
  }, []);

  const value = useMemo(
    () => ({ themeMode, setThemeMode, isReady }),
    [themeMode, setThemeMode, isReady],
  );

  return (
    <ThemeModeContext.Provider value={value}>
      {children}
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  const context = useContext(ThemeModeContext);
  if (!context) {
    throw new Error("useThemeMode must be used within ThemeModeProvider");
  }
  return context;
}
