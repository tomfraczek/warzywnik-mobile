import { restClient } from "@/src/api/axios";
import { useQuery } from "@tanstack/react-query";
import { BedHarvestPromptsResponse, HarvestPromptItem } from "./harvestTypes";

const getBedHarvestPrompts = async (bedId: string) => {
  const { data } = await restClient.get(`/v1/beds/${bedId}/harvest-prompts`);
  const items = Array.isArray(data)
    ? data
    : ((data?.items ?? data?.data ?? []) as HarvestPromptItem[]);

  return {
    items,
  } as BedHarvestPromptsResponse;
};

export const useGetBedHarvestPrompts = (bedId: string | null) => {
  return useQuery({
    queryKey: ["harvest-prompts", bedId],
    queryFn: () => getBedHarvestPrompts(bedId as string),
    enabled: !!bedId,
  });
};
