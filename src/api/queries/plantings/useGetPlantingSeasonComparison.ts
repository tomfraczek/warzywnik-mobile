import { restClient } from "@/src/api/axios";
import { useQuery } from "@tanstack/react-query";
import { PlantingSeasonComparison } from "./learningTypes";
import { plantingKeys } from "./plantingKeys";

const getPlantingSeasonComparison = async (
  id: string,
): Promise<PlantingSeasonComparison> => {
  const { data } = await restClient.get(`/plantings/${id}/season-comparison`);
  return data;
};

export const useGetPlantingSeasonComparison = (id: string | null) => {
  return useQuery({
    queryKey: id
      ? plantingKeys.seasonComparison(id)
      : plantingKeys.seasonComparison("unknown"),
    queryFn: () => getPlantingSeasonComparison(id as string),
    enabled: Boolean(id),
  });
};
