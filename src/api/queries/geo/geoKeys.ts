export const geoKeys = {
  all: ["geo"] as const,
  search: (query: string, lang?: string) =>
    ["geo", "search", query, lang] as const,
  reverse: (lat: number, lon: number, lang?: string) =>
    ["geo", "reverse", lat, lon, lang] as const,
};
