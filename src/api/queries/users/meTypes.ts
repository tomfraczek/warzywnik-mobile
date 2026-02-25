export type WeatherDailyItem = {
  date: string;
  tempMin: number;
  tempMax: number;
  precipSum: number;
  windMax: number;
};

export type WeatherHourlyItem = {
  time: string;
  temp: number;
  precip: number;
  wind: number;
};

export type WeatherResponse = {
  fetchedAt: string;
  expiresAt: string;
  stale: boolean;
  location: {
    label: string;
    lat: number;
    lon: number;
  };
  today: {
    tempMin: number;
    tempMax: number;
    precipSum: number;
    windMax: number;
  };
  daily: WeatherDailyItem[];
  hourly?: WeatherHourlyItem[];
};

export type WarningItem = {
  code: string;
  severity: string;
  title: string;
  message: string;
} & Record<string, unknown>;

export type WarningsResponse = {
  computedAt: string;
  weatherBasis: "FRESH" | "STALE" | "NONE";
  items: WarningItem[];
};

export type TaskItem = {
  id: string;
  title: string;
  dueAt?: string;
  status: string;
} & Record<string, unknown>;

export type TasksResponse = {
  computedAt: string;
  items: TaskItem[];
};
