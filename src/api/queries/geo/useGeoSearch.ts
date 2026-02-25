import { restClient } from "@/src/api/axios";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { geoKeys } from "./geoKeys";
import { GeoSearchItem } from "./types";

const searchGeo = async (
  query: string,
  lang?: string,
  signal?: AbortSignal,
): Promise<GeoSearchItem[]> => {
  const { data } = await restClient.get<GeoSearchItem[]>("/geo/search", {
    params: {
      q: query,
      limit: 6,
      lang,
    },
    signal,
  });
  return data;
};

export const useGeoSearch = (
  query: string,
  lang?: string,
  options?: { enabled?: boolean },
) => {
  const abortControllerRef = useRef<AbortController | null>(null);
  const trimmedQuery = query.trim();

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    };
  }, []);

  return useQuery({
    queryKey: geoKeys.search(trimmedQuery, lang),
    queryFn: async ({ signal }) => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const cancelCurrentRequest = () => controller.abort();
      signal.addEventListener("abort", cancelCurrentRequest);
      if (signal.aborted) {
        controller.abort();
      }

      try {
        return await searchGeo(trimmedQuery, lang, controller.signal);
      } finally {
        signal.removeEventListener("abort", cancelCurrentRequest);
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    },
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 60,
  });
};
