import { restClient } from "@/src/api/axios";
import { useQuery } from "@tanstack/react-query";
import { bedKeys } from "./bedKeys";
import { Bed } from "./types";

const getBed = async (id: string): Promise<Bed> => {
  const { data } = await restClient.get(`/beds/${id}`);
  return data;
};

export const useGetBed = (id: string | null) => {
  return useQuery({
    queryKey: id ? bedKeys.detail(id) : bedKeys.detail("unknown"),
    queryFn: () => getBed(id as string),
    enabled: Boolean(id),
  });
};
