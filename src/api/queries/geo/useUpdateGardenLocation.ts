import { restClient } from "@/src/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  UpdateLocationPreferencePayload,
  UpdateLocationPreferenceResponse,
} from "./types";

type UpdateGardenLocationVariables = {
  gardenId: string;
  payload: UpdateLocationPreferencePayload;
};

const updateGardenLocation = async ({
  gardenId,
  payload,
}: UpdateGardenLocationVariables): Promise<UpdateLocationPreferenceResponse> => {
  const { data } = await restClient.put<UpdateLocationPreferenceResponse>(
    `/gardens/${gardenId}/location`,
    payload,
  );
  return data;
};

export const useUpdateGardenLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateGardenLocation,
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["garden", variables.gardenId],
        }),
        queryClient.invalidateQueries({ queryKey: ["garden"] }),
        queryClient.invalidateQueries({ queryKey: ["gardens"] }),
        queryClient.invalidateQueries({ queryKey: ["weather"] }),
        queryClient.invalidateQueries({ queryKey: ["warnings"] }),
        queryClient.invalidateQueries({ queryKey: ["me", "weather"] }),
        queryClient.invalidateQueries({ queryKey: ["me", "warnings"] }),
        queryClient.invalidateQueries({ queryKey: ["me", "tasks"] }),
        queryClient.invalidateQueries({ queryKey: ["settings"] }),
      ]);
    },
  });
};
