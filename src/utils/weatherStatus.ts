import {
  WeatherStatus,
  WeatherStatusLevel,
  WeatherStatusSeverity,
} from "@/src/api/queries/users/meTypes";

type WeatherStatusKind = "weather" | "garden";

export type NormalizedWeatherStatus = {
  level: WeatherStatusLevel;
  code: string;
  title: string;
  subtitle: string;
  validTo: string | null;
  startsAt: string | null;
  endsAt: string | null;
  sources: string[];
};

const SEVERITY_TO_LEVEL: Record<WeatherStatusSeverity, WeatherStatusLevel> = {
  ok: "ok",
  info: "watch",
  warning: "warning",
  danger: "critical",
};

const CODE_TO_LEVEL: Record<string, WeatherStatusLevel> = {
  CALM: "ok",
  OK: "ok",

  RAIN_NOW: "watch",
  RAIN_SOON: "watch",
  RAIN_LATER: "watch",

  SNOW_NOW: "watch",
  SNOW_SOON: "watch",
  SNOW_LATER: "watch",

  THUNDERSTORM_NOW: "warning",
  THUNDERSTORM_SOON: "warning",
  THUNDERSTORM_LATER: "warning",

  WIND_NOW: "warning",
  WIND_SOON: "warning",
  WIND_LATER: "warning",

  HARD_FROST: "critical",
  FROST: "warning",
  STORM: "warning",
  HEAVY_RAIN: "warning",
  DROUGHT: "watch",
};

const WEATHER_FALLBACKS: Record<string, { title: string; subtitle: string }> = {
  CALM: {
    title: "Spokojna pogoda",
    subtitle: "W najbliższych godzinach bez istotnych zmian.",
  },
  RAIN_NOW: {
    title: "Deszcz teraz",
    subtitle: "Opady występują obecnie w Twojej lokalizacji.",
  },
  RAIN_SOON: {
    title: "Deszcz wkrótce",
    subtitle: "Opady są prognozowane w najbliższych godzinach.",
  },
  RAIN_LATER: {
    title: "Deszcz później",
    subtitle: "Opady są możliwe później dzisiaj.",
  },
  THUNDERSTORM_NOW: {
    title: "Burza teraz",
    subtitle: "Warunki burzowe występują obecnie.",
  },
  THUNDERSTORM_SOON: {
    title: "Burza wkrótce",
    subtitle: "Warunki burzowe są prognozowane w najbliższym czasie.",
  },
  THUNDERSTORM_LATER: {
    title: "Burza później",
    subtitle: "Warunki burzowe są możliwe później dzisiaj.",
  },
  SNOW_NOW: {
    title: "Śnieg teraz",
    subtitle: "Opady śniegu występują obecnie.",
  },
  SNOW_SOON: {
    title: "Śnieg wkrótce",
    subtitle: "Opady śniegu są prognozowane w najbliższym czasie.",
  },
  SNOW_LATER: {
    title: "Śnieg później",
    subtitle: "Opady śniegu są możliwe później dzisiaj.",
  },
  WIND_NOW: {
    title: "Silny wiatr teraz",
    subtitle: "Występują silniejsze porywy wiatru.",
  },
  WIND_SOON: {
    title: "Silny wiatr wkrótce",
    subtitle: "Silniejsze porywy są prognozowane w najbliższych godzinach.",
  },
  WIND_LATER: {
    title: "Silny wiatr później",
    subtitle: "Silniejsze porywy są możliwe później dzisiaj.",
  },
};

const GARDEN_FALLBACKS: Record<string, { title: string; subtitle: string }> = {
  OK: {
    title: "Brak pilnych zagrożeń",
    subtitle: "Warunki są obecnie korzystne dla ogrodu.",
  },
  HARD_FROST: {
    title: "Ryzyko silnego mrozu",
    subtitle: "Możliwe istotne szkody dla wrażliwych upraw.",
  },
  FROST: {
    title: "Ryzyko przymrozków",
    subtitle: "Wrażliwe uprawy mogą wymagać zabezpieczenia.",
  },
  STORM: {
    title: "Ryzyko burz",
    subtitle: "Możliwe szkody mechaniczne dla upraw i podpór.",
  },
  HEAVY_RAIN: {
    title: "Ryzyko intensywnych opadów",
    subtitle: "Nadmierne opady mogą pogorszyć warunki uprawy.",
  },
  DROUGHT: {
    title: "Ryzyko suszy",
    subtitle: "Warto zaplanować dodatkowe nawadnianie upraw.",
  },
};

const asNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const asIsoOrNull = (value: unknown) => {
  const candidate = asNonEmptyString(value);
  if (!candidate) return null;
  const parsed = new Date(candidate);
  return Number.isNaN(parsed.getTime()) ? null : candidate;
};

const normalizeLevel = (value: unknown): WeatherStatusLevel | null => {
  const normalized = asNonEmptyString(value)?.toLowerCase();
  if (
    normalized === "ok" ||
    normalized === "watch" ||
    normalized === "warning" ||
    normalized === "critical"
  ) {
    return normalized;
  }
  return null;
};

const normalizeSeverity = (value: unknown): WeatherStatusSeverity | null => {
  const normalized = asNonEmptyString(value)?.toLowerCase();
  if (
    normalized === "ok" ||
    normalized === "info" ||
    normalized === "warning" ||
    normalized === "danger"
  ) {
    return normalized;
  }
  return null;
};

const deriveLevel = (
  status: WeatherStatus,
  code: string,
  kind: WeatherStatusKind,
): WeatherStatusLevel => {
  const direct = normalizeLevel(status.level);
  if (direct) return direct;

  const severity = normalizeSeverity(status.severity);
  if (severity) return SEVERITY_TO_LEVEL[severity];

  return CODE_TO_LEVEL[code] ?? (kind === "weather" ? "watch" : "ok");
};

const resolveFallbackCopy = (code: string, kind: WeatherStatusKind) => {
  const dictionary = kind === "weather" ? WEATHER_FALLBACKS : GARDEN_FALLBACKS;
  const item = dictionary[code];

  if (item) return item;

  if (kind === "weather") {
    return {
      title: "Zmiana pogody",
      subtitle: "Sprawdź szczegóły najbliższej prognozy.",
    };
  }

  return {
    title: "Status ryzyka dla ogrodu",
    subtitle: "Brak dodatkowych szczegółów dla bieżącego statusu.",
  };
};

const resolveSources = (status: WeatherStatus): string[] => {
  const explicit = Array.isArray(status.sources)
    ? status.sources
        .map((item) => asNonEmptyString(item))
        .filter((item): item is string => Boolean(item))
    : [];

  if (explicit.length > 0) return explicit;

  const source = asNonEmptyString(status.source);
  return source ? [source] : [];
};

export const normalizeWeatherStatus = (
  status: WeatherStatus | null | undefined,
  kind: WeatherStatusKind,
): NormalizedWeatherStatus | null => {
  if (!status) return null;

  const code = asNonEmptyString(status.code)?.toUpperCase() ?? "UNKNOWN";
  const fallbackCopy = resolveFallbackCopy(code, kind);

  const startsAt = asIsoOrNull(status.startsAt);
  const endsAt = asIsoOrNull(status.endsAt);
  const validTo = asIsoOrNull(status.validTo) ?? endsAt;

  return {
    level: deriveLevel(status, code, kind),
    code,
    title: asNonEmptyString(status.title) ?? fallbackCopy.title,
    subtitle: asNonEmptyString(status.subtitle) ?? fallbackCopy.subtitle,
    validTo,
    startsAt,
    endsAt,
    sources: resolveSources(status),
  };
};

const formatTime = (value: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  return new Intl.DateTimeFormat("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
};

const addOneHour = (date: Date) => new Date(date.getTime() + 60 * 60 * 1000);

export const formatWeatherStatusTimeWindow = (
  status: Pick<NormalizedWeatherStatus, "startsAt" | "endsAt" | "validTo">,
): string | null => {
  const startDate = status.startsAt ? new Date(status.startsAt) : null;
  const endDate = status.endsAt ? new Date(status.endsAt) : null;

  const hasValidStart = Boolean(
    startDate && !Number.isNaN(startDate.getTime()),
  );
  const hasValidEnd = Boolean(endDate && !Number.isNaN(endDate.getTime()));

  let startsAt = hasValidStart ? formatTime(status.startsAt) : null;
  let endsAt = hasValidEnd ? formatTime(status.endsAt) : null;
  const validTo = formatTime(status.validTo);

  if (hasValidStart && hasValidEnd && startDate && endDate) {
    let safeEnd = endDate;

    if (safeEnd.getTime() <= startDate.getTime()) {
      safeEnd = addOneHour(startDate);
    }

    startsAt = formatTime(startDate.toISOString());
    endsAt = formatTime(safeEnd.toISOString());

    if (startsAt && endsAt && startsAt === endsAt) {
      safeEnd = addOneHour(safeEnd);
      endsAt = formatTime(safeEnd.toISOString());
    }
  }

  if (startsAt && endsAt) {
    return `Od ${startsAt} do ${endsAt}`;
  }

  if (startsAt) {
    return `Od około ${startsAt}`;
  }

  return null;
};
