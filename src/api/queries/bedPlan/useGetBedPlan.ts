import { restClient } from "@/src/api/axios";
import { useQuery } from "@tanstack/react-query";
import { bedPlanKeys } from "./bedPlanKeys";
import { BedPlanResponse } from "./types";

const getBedPlan = async (bedId: string): Promise<BedPlanResponse> => {
  const { data } = await restClient.get<BedPlanResponse>(`/beds/${bedId}/plan`);
  return data;
};

export const useGetBedPlan = (bedId: string | null) =>
  useQuery({
    queryKey: bedId ? bedPlanKeys.byBed(bedId) : bedPlanKeys.byBed("unknown"),
    queryFn: () => getBedPlan(bedId as string),
    enabled: Boolean(bedId),
  });
