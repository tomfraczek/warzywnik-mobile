import { restClient } from "@/src/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bedKeys } from "./bedKeys";

const deleteBed = async (id: string): Promise<void> => {
  await restClient.delete(`/beds/${id}`);
};

export const useDeleteBed = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBed,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bedKeys.all });
    },
  });
};
