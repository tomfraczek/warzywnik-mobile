import { restClient } from "@/src/api/axios";
import { useQuery } from "@tanstack/react-query";
import { pestKeys } from "./pestKeys";
import { Pest } from "./types";

const getPest = async (id: string): Promise<Pest> => {
  const { data } = await restClient.get(`/pests/${id}`);
  return data;
};

export const useGetPest = (id: string | null) => {
  return useQuery({
    queryKey: id ? pestKeys.detail(id) : pestKeys.detail("unknown"),
    queryFn: () => getPest(id as string),
    enabled: Boolean(id),
  });
};
