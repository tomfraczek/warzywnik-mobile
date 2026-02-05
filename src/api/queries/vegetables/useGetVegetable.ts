import { restClient } from "@/src/api/axios";
import { useQuery } from "@tanstack/react-query";
import { Vegetable } from "./types";
import { vegetableKeys } from "./vegetableKeys";

const getVegetable = async (id: string): Promise<Vegetable> => {
  const { data } = await restClient.get(`/vegetables/${id}`);
  return data;
};

export const useGetVegetable = (id: string | null) =>
  useQuery({
    queryKey: id ? vegetableKeys.detail(id) : vegetableKeys.detail("unknown"),
    queryFn: () => getVegetable(id as string),
    enabled: Boolean(id),
  });
