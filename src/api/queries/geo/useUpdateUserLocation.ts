import { restClient } from "@/src/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  UpdateLocationPreferencePayload,
  UpdateLocationPreferenceResponse,
} from "./types";

const updateUserLocation = async (
  payload: UpdateLocationPreferencePayload,
): Promise<UpdateLocationPreferenceResponse> => {
  const { data } = await restClient.put<UpdateLocationPreferenceResponse>(
    "/users/me/location",
    payload,
  );
  return data;
};

export const useUpdateUserLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUserLocation,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["garden"] }),
        queryClient.invalidateQueries({ queryKey: ["gardens"] }),
        queryClient.invalidateQueries({ queryKey: ["weather"] }),
        queryClient.invalidateQueries({ queryKey: ["warnings"] }),
        queryClient.invalidateQueries({ queryKey: ["settings"] }),
        queryClient.invalidateQueries({ queryKey: ["currentUser"] }),
      ]);
    },
  });
};
