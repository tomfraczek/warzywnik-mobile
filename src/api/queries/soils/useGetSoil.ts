import { restClient } from "@/src/api/axios";
import { useQuery } from "@tanstack/react-query";
import { soilKeys } from "./soilKeys";
import { Soil } from "./types";

const getSoil = async (id: string): Promise<Soil> => {
  const { data } = await restClient.get(`/soils/${id}`);
  return data;
};

export const useGetSoil = (id: string | null) => {
  return useQuery({
    queryKey: id ? soilKeys.detail(id) : soilKeys.detail("unknown"),
    queryFn: () => getSoil(id as string),
    enabled: Boolean(id),
  });
};
