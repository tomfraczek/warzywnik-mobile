import { restClient } from "@/src/api/axios";
import { useQuery } from "@tanstack/react-query";
import { geoKeys } from "./geoKeys";
import { GeoReverseResult } from "./types";

const reverseGeo = async (
  lat: number,
  lon: number,
  lang?: string,
  signal?: AbortSignal,
): Promise<GeoReverseResult> => {
  const { data } = await restClient.get<GeoReverseResult>("/geo/reverse", {
    params: {
      lat,
      lon,
      lang,
    },
    signal,
  });

  return data;
};

export const useGeoReverse = (
  lat: number | null,
  lon: number | null,
  lang?: string,
  options?: { enabled?: boolean },
) => {
  const isEnabled =
    options?.enabled ??
    (typeof lat === "number" &&
      typeof lon === "number" &&
      Number.isFinite(lat) &&
      Number.isFinite(lon));

  return useQuery({
    queryKey: geoKeys.reverse(lat ?? 0, lon ?? 0, lang),
    queryFn: ({ signal }) => {
      if (lat === null || lon === null) {
        throw new Error("Missing coordinates for reverse geocoding");
      }
      return reverseGeo(lat, lon, lang, signal);
    },
    enabled: isEnabled,
    staleTime: 1000 * 60 * 5,
  });
};
