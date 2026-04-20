import { restClient } from "@/src/api/axios";
import { useQuery } from "@tanstack/react-query";
import { PopularVegetablesParams, PopularVegetablesResponse } from "./types";

const analyticsKeys = {
  popularVegetables: (params: PopularVegetablesParams) =>
    ["analytics", "vegetables", "popular", params] as const,
  popularArticles: (params: { limit?: number; sort?: string }) =>
    ["analytics", "articles", "popular", params] as const,
};

export { analyticsKeys };

const getPopularVegetables = async (
  params: PopularVegetablesParams,
): Promise<PopularVegetablesResponse> => {
  const { data } = await restClient.get<PopularVegetablesResponse>(
    "/analytics/vegetables/popular",
    { params },
  );
  return data;
};

export const useGetPopularVegetables = (
  params: PopularVegetablesParams = {},
) => {
  return useQuery({
    queryKey: analyticsKeys.popularVegetables(params),
    queryFn: () => getPopularVegetables(params),
    staleTime: 5 * 60 * 1000, // 5 min
  });
};
