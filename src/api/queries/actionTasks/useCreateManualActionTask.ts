import { restClient } from "@/src/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bedKeys } from "../beds/bedKeys";
import { plantingKeys } from "../plantings/plantingKeys";
import { actionTaskKeys } from "./actionTaskKeys";
import { ActionTask, CreateManualActionTaskPayload } from "./types";

export const createBedActionTask = async (params: {
  bedId: string;
  payload: CreateManualActionTaskPayload;
}): Promise<ActionTask> => {
  const { data } = await restClient.post(
    `/beds/${params.bedId}/action-tasks`,
    params.payload,
  );
  return data as ActionTask;
};

export const createPlantingActionTask = async (params: {
  plantingId: string;
  payload: CreateManualActionTaskPayload;
}): Promise<ActionTask> => {
  const { data } = await restClient.post(
    `/plantings/${params.plantingId}/action-tasks`,
    params.payload,
  );
  return data as ActionTask;
};

const invalidateAfterCreate = async (
  queryClient: ReturnType<typeof useQueryClient>,
  params: { bedId?: string; plantingId?: string },
) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: actionTaskKeys.all }),
    queryClient.invalidateQueries({ queryKey: ["calendar"] }),
    queryClient.invalidateQueries({ queryKey: ["me", "tasks"] }),
    queryClient.invalidateQueries({ queryKey: bedKeys.all }),
    queryClient.invalidateQueries({ queryKey: plantingKeys.all }),
    queryClient.invalidateQueries({ queryKey: ["harvest-prompts"] }),
  ]);

  if (params.bedId) {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: actionTaskKeys.bed(params.bedId),
        exact: false,
      }),
      queryClient.invalidateQueries({ queryKey: bedKeys.detail(params.bedId) }),
    ]);
  }

  if (params.plantingId) {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: actionTaskKeys.planting(params.plantingId),
        exact: false,
      }),
      queryClient.invalidateQueries({
        queryKey: plantingKeys.detail(params.plantingId),
      }),
      queryClient.invalidateQueries({
        queryKey: plantingKeys.timeline(params.plantingId),
      }),
    ]);
  }
};

export const useCreateBedActionTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBedActionTask,
    onSuccess: async (createdTask, variables) => {
      await invalidateAfterCreate(queryClient, {
        bedId: createdTask.bedId ?? variables.bedId,
        plantingId: createdTask.plantingId ?? undefined,
      });
    },
  });
};

export const useCreatePlantingActionTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPlantingActionTask,
    onSuccess: async (createdTask, variables) => {
      await invalidateAfterCreate(queryClient, {
        plantingId: createdTask.plantingId ?? variables.plantingId,
        bedId: createdTask.bedId ?? undefined,
      });
    },
  });
};
