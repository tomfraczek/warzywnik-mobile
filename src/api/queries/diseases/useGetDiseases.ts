import { restClient } from "@/src/api/axios";
import { useInfiniteQuery } from "@tanstack/react-query";
import { DiseaseListParams, diseaseKeys } from "./diseaseKeys";
import { DiseaseListItem } from "./types";

type DiseasesPage = {
  items: DiseaseListItem[];
  page: number;
  limit: number;
  total: number;
  nextPage: number | undefined;
};

const getDiseases = async (
  params: DiseaseListParams,
  pageParam: number,
): Promise<DiseasesPage> => {
  const limit = params.limit ?? 20;
  const { data } = await restClient.get("/diseases", {
    params: {
      page: pageParam,
      limit,
      q: params.q?.trim() || undefined,
    },
  });
  const items: DiseaseListItem[] = data?.items ?? [];
  const total: number = data?.total ?? 0;
  const nextPage = pageParam * limit < total ? pageParam + 1 : undefined;
  return { items, page: pageParam, limit, total, nextPage };
};

export const useGetDiseases = (params: DiseaseListParams = {}) => {
  return useInfiniteQuery({
    queryKey: diseaseKeys.list(params),
    queryFn: ({ pageParam = 1 }) => getDiseases(params, pageParam as number),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  });
};
