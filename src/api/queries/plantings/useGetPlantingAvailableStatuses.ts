import { restClient } from "@/src/api/axios";
import { useQuery } from "@tanstack/react-query";
import { plantingKeys } from "./plantingKeys";
import { PlantingAvailableStatusesResponse } from "./types";

const getPlantingAvailableStatuses = async (
  id: string,
): Promise<PlantingAvailableStatusesResponse> => {
  const { data } = await restClient.get(`/plantings/${id}/available-statuses`);
  return data;
};

export const useGetPlantingAvailableStatuses = (
  id: string | null,
  enabled = true,
) => {
  return useQuery({
    queryKey: id
      ? plantingKeys.availableStatuses(id)
      : plantingKeys.availableStatuses("unknown"),
    queryFn: () => getPlantingAvailableStatuses(id as string),
    enabled: Boolean(id) && enabled,
  });
};
