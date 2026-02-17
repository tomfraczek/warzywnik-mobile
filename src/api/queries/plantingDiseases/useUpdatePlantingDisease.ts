import { restClient } from "@/src/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { plantingDiseaseKeys } from "./plantingDiseaseKeys";
import { PlantingDisease, UpdatePlantingDiseaseDto } from "./types";

const updatePlantingDisease = async (
  plantingId: string,
  diseaseId: string,
  payload: UpdatePlantingDiseaseDto,
): Promise<PlantingDisease> => {
  const { data } = await restClient.patch(
    `/plantings/${plantingId}/diseases/${diseaseId}`,
    payload,
  );
  return data;
};

export const useUpdatePlantingDisease = (plantingId: string | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      diseaseId,
      payload,
    }: {
      diseaseId: string;
      payload: UpdatePlantingDiseaseDto;
    }) => updatePlantingDisease(plantingId as string, diseaseId, payload),
    onSuccess: () => {
      if (plantingId) {
        queryClient.invalidateQueries({
          queryKey: plantingDiseaseKeys.list({
            plantingId,
            status: "active",
          }),
        });
        queryClient.invalidateQueries({
          queryKey: plantingDiseaseKeys.list({
            plantingId,
            status: "all",
          }),
        });
      }
    },
  });
};
