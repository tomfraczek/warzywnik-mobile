import { restClient } from "@/src/api/axios";
import { useQuery } from "@tanstack/react-query";
import { PopularArticlesParams, PopularArticlesResponse } from "./types";
import { analyticsKeys } from "./useGetPopularVegetables";

const getPopularArticles = async (
  params: PopularArticlesParams,
): Promise<PopularArticlesResponse> => {
  const { data } = await restClient.get<PopularArticlesResponse>(
    "/analytics/articles/popular",
    { params },
  );
  return data;
};

export const useGetPopularArticles = (params: PopularArticlesParams = {}) => {
  return useQuery({
    queryKey: analyticsKeys.popularArticles(params),
    queryFn: () => getPopularArticles(params),
    staleTime: 5 * 60 * 1000, // 5 min
  });
};
