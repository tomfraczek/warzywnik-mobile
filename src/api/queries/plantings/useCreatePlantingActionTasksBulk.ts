import { restClient } from "@/src/api/axios";
import {
  CreateBedActionTaskItemDto,
  CreateBedActionTasksBulkDto,
} from "@/src/api/queries/beds/harvestTypes";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { plantingKeys } from "./plantingKeys";

const createSinglePlantingActionTask = async (
  plantingId: string,
  item: CreateBedActionTaskItemDto,
) => {
  const payload = {
    actionTemplateId: item.actionTemplateId,
    ...(item.dueDate ? { dueDate: item.dueDate } : {}),
  };
  const { data } = await restClient.post(
    `/plantings/${plantingId}/action-tasks`,
    payload,
  );
  return data;
};

const createPlantingActionTasksBulk = async (
  plantingId: string,
  payload: CreateBedActionTasksBulkDto,
) => {
  const normalizedPayload: CreateBedActionTasksBulkDto = {
    items: payload.items.map((item) => ({
      actionTemplateId: item.actionTemplateId,
      ...(item.dueDate ? { dueDate: item.dueDate } : {}),
    })),
  };

  try {
    const { data } = await restClient.post(
      `/plantings/${plantingId}/action-tasks/bulk`,
      normalizedPayload,
    );
    return data;
  } catch (error) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;

    if (status !== 404 && status !== 405) {
      throw error;
    }

    const created = [];
    for (const item of normalizedPayload.items) {
      const single = await createSinglePlantingActionTask(plantingId, item);
      created.push(single);
    }

    return { items: created };
  }
};

export const useCreatePlantingActionTasksBulk = (plantingId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBedActionTasksBulkDto) =>
      createPlantingActionTasksBulk(plantingId as string, payload),
    onSuccess: () => {
      if (!plantingId) return;
      queryClient.invalidateQueries({ queryKey: plantingKeys.all });
      queryClient.invalidateQueries({
        queryKey: plantingKeys.detail(plantingId),
      });
      queryClient.invalidateQueries({
        queryKey: plantingKeys.timeline(plantingId),
      });
      queryClient.invalidateQueries({
        queryKey: ["action-tasks", "planting", plantingId],
      });
      queryClient.invalidateQueries({ queryKey: ["me", "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
    },
  });
};
