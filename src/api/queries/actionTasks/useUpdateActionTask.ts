import { restClient } from "@/src/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bedKeys } from "../beds/bedKeys";
import { plantingKeys } from "../plantings/plantingKeys";
import { actionTaskKeys } from "./actionTaskKeys";
import { ActionTask, UpdateActionTaskDto } from "./types";

const updateActionTask = async (params: {
  id: string;
  payload: UpdateActionTaskDto;
}): Promise<ActionTask> => {
  const { data } = await restClient.patch(
    `/action-tasks/${params.id}`,
    params.payload,
  );
  return data as ActionTask;
};

export const useUpdateActionTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateActionTaskDto;
    }) => updateActionTask({ id, payload }),
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
