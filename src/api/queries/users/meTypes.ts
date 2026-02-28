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
  code: string;
  severity: string;
  title: string;
  message: string;
  hint?: string | null;
  scope?: WarningScope | string;
  details?:
    | (Record<string, unknown> & {
        scope?: WarningScope | string;
        bedId?: string | null;
        bedName?: string | null;
        plantingId?: string | null;
        vegetableName?: string | null;
      })
    | null;
} & Record<string, unknown>;

export type WarningsResponse = {
  computedAt: string;
  weatherBasis: WeatherBasis;
  items: WarningItem[];
};

export type TaskSource = "WEATHER_WARNING" | string;

export type TaskItem = {
  id: string;
  title: string;
  description?: string | null;
  dueAt?: string;
  status: string;
  source?: TaskSource;
  bedId?: string | null;
  plantingId?: string | null;
  dedupeKey?: string | null;
} & Record<string, unknown>;

export type TasksResponse = {
  computedAt: string;
  items: TaskItem[];
};
