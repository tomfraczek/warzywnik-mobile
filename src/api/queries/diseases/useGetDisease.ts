import { restClient } from "@/src/api/axios";
import { useQuery } from "@tanstack/react-query";
import { diseaseKeys } from "./diseaseKeys";
import { Disease } from "./types";

const getDisease = async (id: string): Promise<Disease> => {
  const { data } = await restClient.get(`/diseases/${id}`);
  return data;
};

export const useGetDisease = (id: string | null) => {
  return useQuery({
    queryKey: id ? diseaseKeys.detail(id) : diseaseKeys.detail("unknown"),
    queryFn: () => getDisease(id as string),
    enabled: Boolean(id),
  });
};
