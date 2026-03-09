import { restClient } from "@/src/api/axios";
import { useQuery } from "@tanstack/react-query";
import { BedSeasonsResponse } from "../plantings/learningTypes";
import { bedKeys } from "./bedKeys";

const getBedSeasons = async (bedId: string): Promise<BedSeasonsResponse> => {
  const { data } = await restClient.get(`/beds/${bedId}/seasons`);
  return data;
};

export const useGetBedSeasons = (bedId: string | null) => {
  return useQuery({
    queryKey: bedId ? bedKeys.seasons(bedId) : bedKeys.seasons("unknown"),
    queryFn: () => getBedSeasons(bedId as string),
    enabled: Boolean(bedId),
  });
};
