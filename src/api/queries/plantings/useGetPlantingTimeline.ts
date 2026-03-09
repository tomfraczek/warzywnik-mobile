import { restClient } from "@/src/api/axios";
import { useQuery } from "@tanstack/react-query";
import { PlantingTimeline } from "./learningTypes";
import { plantingKeys } from "./plantingKeys";

const getPlantingTimeline = async (id: string): Promise<PlantingTimeline> => {
  const { data } = await restClient.get(`/plantings/${id}/timeline`);
  return data;
};

export const useGetPlantingTimeline = (id: string | null) => {
  return useQuery({
    queryKey: id ? plantingKeys.timeline(id) : plantingKeys.timeline("unknown"),
    queryFn: () => getPlantingTimeline(id as string),
    enabled: Boolean(id),
  });
};
