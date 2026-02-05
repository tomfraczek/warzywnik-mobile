import { restClient } from "@/src/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { plantingKeys } from "./plantingKeys";

const deletePlanting = async (id: string) => {
  await restClient.delete(`/plantings/${id}`);
  return id;
};

export const useDeletePlanting = (bedId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePlanting,
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: plantingKeys.all });
      if (bedId) {
        queryClient.invalidateQueries({
          queryKey: plantingKeys.list({ bedId }),
        });
      }
      queryClient.removeQueries({ queryKey: plantingKeys.detail(deletedId) });
    },
  });
};
