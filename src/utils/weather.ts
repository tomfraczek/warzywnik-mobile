import { WeatherType } from "@/src/api/queries/users/meTypes";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ComponentProps } from "react";

type WeatherIconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

type WeatherFallbackMetrics = {
  precip?: number | null;
  rain?: number | null;
  snow?: number | null;
  isDay?: boolean | null;
};

const WEATHER_TYPE_LABELS: Record<WeatherType, string> = {
  CLEAR: "Słonecznie",
  PARTLY_CLOUDY: "Częściowe zachmurzenie",
  CLOUDY: "Pochmurnie",
  FOG: "Mgła",
  DRIZZLE: "Mżawka",
  RAIN: "Deszcz",
  SNOW: "Śnieg",
  THUNDERSTORM: "Burza",
  HAIL: "Grad",
  UNKNOWN: "Nieznane warunki",
};

const WEATHER_TYPE_ICONS: Record<WeatherType, WeatherIconName> = {
  CLEAR: "weather-sunny",
  PARTLY_CLOUDY: "weather-partly-cloudy",
  CLOUDY: "weather-cloudy",
  FOG: "weather-fog",
  DRIZZLE: "weather-pouring",
  RAIN: "weather-rainy",
  SNOW: "weather-snowy",
  THUNDERSTORM: "weather-lightning-rainy",
  HAIL: "weather-hail",
  UNKNOWN: "weather-partly-cloudy",
};

const normalizeWeatherType = (
  weatherType?: string | null,
): WeatherType | null => {
  if (!weatherType) return null;

  const normalized = weatherType
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");

  if (normalized in WEATHER_TYPE_LABELS) {
    return normalized as WeatherType;
  }

  return null;
};

const hasPositive = (value?: number | null) =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const isZero = (value?: number | null) =>
  typeof value === "number" && Number.isFinite(value) && value === 0;

const isUnknownWeatherLabel = (weatherLabel?: string | null) => {
  if (!weatherLabel) return true;
  const normalized = weatherLabel.trim().toLowerCase();
  return (
    normalized.length === 0 ||
    normalized === "nieznane warunki" ||
    normalized === "unknown"
  );
};

export const resolveWeatherLabel = (
  weatherLabel?: string | null,
  weatherType?: string | null,
  fallback?: WeatherFallbackMetrics,
) => {
  if (
    typeof weatherLabel === "string" &&
    weatherLabel.trim().length > 0 &&
    !isUnknownWeatherLabel(weatherLabel)
  ) {
    return weatherLabel;
  }

  const normalizedType = normalizeWeatherType(weatherType);
  if (
    normalizedType &&
    normalizedType !== "UNKNOWN" &&
    WEATHER_TYPE_LABELS[normalizedType]
  ) {
    return WEATHER_TYPE_LABELS[normalizedType];
  }

  if (hasPositive(fallback?.snow)) return "Śnieg";
  if (hasPositive(fallback?.rain) || hasPositive(fallback?.precip))
    return "Deszcz";
  return "Nieznane warunki";
};

export const getWeatherIconName = (
  weatherType?: string | null,
  fallback?: WeatherFallbackMetrics,
) => {
  const normalizedType = normalizeWeatherType(weatherType);
  if (
    normalizedType &&
    normalizedType !== "UNKNOWN" &&
    WEATHER_TYPE_ICONS[normalizedType]
  ) {
    return WEATHER_TYPE_ICONS[normalizedType];
  }

  if (hasPositive(fallback?.snow)) return WEATHER_TYPE_ICONS.SNOW;
  if (hasPositive(fallback?.rain) || hasPositive(fallback?.precip))
    return WEATHER_TYPE_ICONS.RAIN;
  if (fallback?.isDay === false) return "weather-night";
  if (isZero(fallback?.precip)) return WEATHER_TYPE_ICONS.CLEAR;

  return WEATHER_TYPE_ICONS.UNKNOWN;
};

export const toIntTemperature = (value?: number | null) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const rounded = Math.round(value);
  return Object.is(rounded, -0) ? 0 : rounded;
};

export const formatTemperature = (value?: number | null) => {
  const normalized = toIntTemperature(value);
  return normalized === null ? "--" : `${normalized}`;
};
