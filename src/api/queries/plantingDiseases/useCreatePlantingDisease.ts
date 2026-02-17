import { restClient } from "@/src/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reminderKeys } from "../reminders/reminderKeys";
import { plantingDiseaseKeys } from "./plantingDiseaseKeys";
import { CreatePlantingDiseaseDto, PlantingDisease } from "./types";

const createPlantingDisease = async (
  plantingId: string,
  payload: CreatePlantingDiseaseDto,
): Promise<PlantingDisease> => {
  const { data } = await restClient.post(
    `/plantings/${plantingId}/diseases`,
    payload,
  );
  return data;
};

export const useCreatePlantingDisease = (plantingId: string | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePlantingDiseaseDto) =>
      createPlantingDisease(plantingId as string, payload),
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
        queryClient.invalidateQueries({ queryKey: reminderKeys.all });
      }
    },
  });
};
