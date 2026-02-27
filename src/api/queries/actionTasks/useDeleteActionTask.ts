import { restClient } from "@/src/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { actionTaskKeys } from "./actionTaskKeys";

const deleteActionTask = async (id: string): Promise<void> => {
  await restClient.delete(`/action-tasks/${id}`);
};

export const useDeleteActionTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteActionTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: actionTaskKeys.all });
      queryClient.invalidateQueries({ queryKey: ["bed-action-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
    },
  });
};
