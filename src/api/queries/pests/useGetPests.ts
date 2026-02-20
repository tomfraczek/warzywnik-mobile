import { restClient } from "@/src/api/axios";
import { useQuery } from "@tanstack/react-query";
import { PestListParams, pestKeys } from "./pestKeys";
import { ListPestsResponse, Pest } from "./types";

const getPests = async (params: PestListParams): Promise<ListPestsResponse> => {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const { data } = await restClient.get("/pests", {
    params: {
      page,
      limit,
      q: params.q?.trim() || undefined,
    },
  });
  const items = (
    Array.isArray(data)
      ? data
      : (data?.items ?? data?.data ?? data?.results ?? [])
  ) as Pest[];
  const total =
    data?.total ??
    data?.meta?.total ??
    data?.pagination?.total ??
    data?.pageMeta?.total ??
    items.length;

  return {
    items,
    page,
    limit,
    total,
  };
};

export const useGetPests = (params: PestListParams = {}) => {
  return useQuery({
    queryKey: pestKeys.list(params),
    queryFn: () => getPests(params),
  });
};
