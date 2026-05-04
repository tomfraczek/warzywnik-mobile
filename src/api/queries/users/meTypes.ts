export type WeatherType =
  | "CLEAR"
  | "PARTLY_CLOUDY"
  | "CLOUDY"
  | "FOG"
  | "DRIZZLE"
  | "RAIN"
  | "SNOW"
  | "THUNDERSTORM"
  | "HAIL"
  | "UNKNOWN";

export type WeatherBasis = "FRESH" | "STALE" | "NONE";
export type WeatherProvider = "OPEN_METEO";
export type WarningScope = "USER" | "BED" | "PLANTING";
export type WarningSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
/** @deprecated Horizon is now derived from code + localDate – not sent by the backend. */
export type WarningHorizon = "RADAR" | "OPERATIONAL";
/** "ANY" means the alert applies to the full day (not just DAY or NIGHT part). */
export type WarningDayPart = "DAY" | "NIGHT" | "ANY";
/** Open string type – backend may emit new codes; treat unknowns gracefully. */
export type WarningCode = string;

export type WeatherHourlyItem = {
  time: string;
  temp: number;
  weatherType: WeatherType;
  weatherLabel: string;
  windSpeed: number;
  precip: number;
  rain: number;
  snow: number;
  isDay?: boolean;
};

export type WeatherDayItem = {
  date: string;
  tempMin: number;
  tempMax: number;
  weatherType: WeatherType;
  weatherLabel: string;
  windMax: number;
  precipSum: number;
};

export type WeatherResponse = {
  fetchedAt: string;
  expiresAt: string;
  stale: boolean;
  message?: string;
  location: {
    label: string;
    lat: number;
    lon: number;
  };
  units: {
    temperature: "°C";
    wind: "km/h";
    precipitation: "mm";
  };
  current: {
    time: string;
    temp: number;
    weatherType: WeatherType;
    weatherLabel: string;
    isDay: boolean;
    windSpeed: number;
    precip: number;
    rain: number;
    snow: number;
  };
  today: {
    date: string;
    tempMin: number;
    tempMax: number;
    weatherType: WeatherType;
    weatherLabel: string;
    precipSum: number;
    windMax: number;
  };
  hourlyToday: WeatherHourlyItem[];
  nextDays: WeatherDayItem[];
};

export type WarningItem = {
  dedupeKey: string;
  code: WarningCode;
  severity: WarningSeverity;
  title: string;
  message: string;
  hint: string | null;
  details: Record<string, unknown> | null;
  scope: WarningScope;
  bedId: string | null;
  bedName: string | null;
  plantingId: string | null;
  vegetableName: string | null;
  /** YYYY-MM-DD in the user's local timezone. Primary source of truth for grouping. */
  localDate: string | null;
  /** Which part of the day the alert covers. */
  dayPart: WarningDayPart | null;
  /** ISO 8601 UTC – start of the alert's validity window. */
  validFrom: string | null;
  /** ISO 8601 UTC – end of the alert's validity window. */
  validTo: string | null;
};

export type WarningsResponse = {
  computedAt: string;
  weatherBasis: WeatherBasis;
  items: WarningItem[];
};

export type TaskSource = "WEATHER_WARNING" | "AUTOMATION" | string;
export type TaskSourceType = "MANUAL" | "AUTOMATION" | "SUGGESTION";
export type TaskStatus = "PENDING" | "DONE" | "CANCELED";
export type TaskTargetType = "USER" | "BED" | "PLANTING";
export type TaskStatusFilter = "pending" | "done" | "all";

/** Metadata attached to a task – provides context about scope and origin. */
export type TaskMetaDto = {
  scope?: WarningScope;
  affectsAllBeds: boolean;
  affectedBedIds?: string[];
  affectedBedsCount?: number;
  locationLabel?: string | null;
  warningCode?: WarningCode;
};

export type TaskItem = {
  id: string;
  title: string;
  description?: string | null;
  dueAt?: string | null;
  status: string;
  source?: TaskSource;
  sourceType?: TaskSourceType | string;
  sourceKey?: string | null;
  isUserModified?: boolean;
  suppressedAt?: string | null;
  /** "USER" | "BED" | "PLANTING" – uppercase from the new API contract. */
  targetType?: TaskTargetType | string;
  plantingId?: string | null;
  bedId?: string | null;
  actionTemplate?: {
    id: string;
    slug?: string;
    name: string;
    target?: string;
    type?: string;
    description?: string | null;
    defaultDueOffsetDays?: number | null;
  } | null;
  isManuallyRescheduled?: boolean;
  meta?: TaskMetaDto | null;
} & Record<string, unknown>;

export type TasksResponse = {
  computedAt: string;
  items: TaskItem[];
};
