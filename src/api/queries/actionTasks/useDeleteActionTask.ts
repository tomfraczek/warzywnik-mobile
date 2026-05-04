import { restClient } from "@/src/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bedKeys } from "../beds/bedKeys";
import { plantingKeys } from "../plantings/plantingKeys";
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
      queryClient.invalidateQueries({ queryKey: ["me", "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["beds"], exact: false });
      queryClient.invalidateQueries({ queryKey: bedKeys.all });
      queryClient.invalidateQueries({ queryKey: ["plantings"], exact: false });
      queryClient.invalidateQueries({ queryKey: plantingKeys.all });
      queryClient.invalidateQueries({ queryKey: ["harvest-prompts"] });
      queryClient.invalidateQueries({
        queryKey: ["plantings", "timeline"],
        exact: false,
      });
    },
  });
};
