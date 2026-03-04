import { restClient } from "@/src/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { actionTaskKeys } from "../actionTasks/actionTaskKeys";
import { bedKeys } from "./bedKeys";
import { Bed, UpdateBedDto } from "./types";

const updateBed = async ({
  id,
  payload,
}: {
  id: string;
  payload: UpdateBedDto;
}): Promise<Bed> => {
  const { data } = await restClient.patch(`/beds/${id}`, payload);
  return data;
};

export const useUpdateBed = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateBedDto) => updateBed({ id, payload }),
    onSuccess: async (_updatedBed, payload) => {
      const invalidations = [
        queryClient.invalidateQueries({ queryKey: bedKeys.detail(id) }),
        queryClient.invalidateQueries({ queryKey: bedKeys.all }),
      ];

      if (payload.isActive !== undefined) {
        invalidations.push(
          queryClient.invalidateQueries({ queryKey: ["warnings"] }),
          queryClient.invalidateQueries({ queryKey: ["me", "warnings"] }),
          queryClient.invalidateQueries({ queryKey: ["me", "tasks"] }),
          queryClient.invalidateQueries({ queryKey: actionTaskKeys.all }),
          queryClient.invalidateQueries({ queryKey: ["calendar"] }),
        );
      }

      await Promise.all(invalidations);
    },
  });
};
