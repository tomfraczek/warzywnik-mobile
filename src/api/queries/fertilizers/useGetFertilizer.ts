import { restClient } from "@/src/api/axios";
import { useQuery } from "@tanstack/react-query";
import { fertilizerKeys } from "./fertilizerKeys";
import { Fertilizer } from "./types";

const getFertilizer = async (id: string): Promise<Fertilizer> => {
  const { data } = await restClient.get(`/fertilizers/${id}`);
  return data;
};

export const useGetFertilizer = (id: string | null) => {
  return useQuery({
    queryKey: id ? fertilizerKeys.detail(id) : fertilizerKeys.detail("unknown"),
    queryFn: () => getFertilizer(id as string),
    enabled: Boolean(id),
  });
};
