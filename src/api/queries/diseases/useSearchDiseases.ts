import { restClient } from "@/src/api/axios";
import { parsePaginatedResponse } from "@/src/api/queries/pagination";
import { useQuery } from "@tanstack/react-query";
import { diseaseKeys } from "./diseaseKeys";
import { DiseaseListItem } from "./types";

const searchDiseases = async (q: string, limit: number) => {
  const { data } = await restClient.get("/diseases", {
    params: {
      page: 1,
      limit,
      q: q.trim() || undefined,
    },
  });
  return parsePaginatedResponse<DiseaseListItem>(data, 1, limit).items;
};

export const useSearchDiseases = (q: string) => {
  const trimmed = q.trim();
  return useQuery({
    queryKey: diseaseKeys.list({ q: trimmed || undefined, limit: 50 }),
    queryFn: () => searchDiseases(trimmed, 50),
    enabled: trimmed.length >= 2,
  });
};
