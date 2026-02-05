import { restClient } from "@/src/api/axios";
import { useQuery } from "@tanstack/react-query";
import { plantingKeys } from "./plantingKeys";
import { Planting } from "./types";

const getPlanting = async (id: string): Promise<Planting> => {
  const { data } = await restClient.get(`/plantings/${id}`);
  return data;
};

export const useGetPlanting = (id: string | null) => {
  return useQuery({
    queryKey: id ? plantingKeys.detail(id) : plantingKeys.detail("unknown"),
    queryFn: () => getPlanting(id as string),
    enabled: Boolean(id),
  });
};
