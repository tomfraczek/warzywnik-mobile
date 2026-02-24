import { restClient } from "@/src/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { bedKeys } from "./bedKeys";
import {
  CreateBedActionTaskItemDto,
  CreateBedActionTasksBulkDto,
} from "./harvestTypes";

const createSingleBedActionTask = async (
  bedId: string,
  item: CreateBedActionTaskItemDto,
) => {
  const { data } = await restClient.post(`/beds/${bedId}/action-tasks`, item);
  return data;
};

const createBedActionTasksBulk = async (
  bedId: string,
  payload: CreateBedActionTasksBulkDto,
) => {
  try {
    const { data } = await restClient.post(
      `/beds/${bedId}/action-tasks/bulk`,
      payload,
    );
    return data;
  } catch (error) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;

    // Fallback to single-item endpoint when bulk endpoint is not available.
    if (status !== 404 && status !== 405) {
      throw error;
    }

    const created = [];
    for (const item of payload.items) {
      const single = await createSingleBedActionTask(bedId, item);
      created.push(single);
    }

    return {
      items: created,
    };
  }
};

export const useCreateBedActionTasksBulk = (bedId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBedActionTasksBulkDto) =>
      createBedActionTasksBulk(bedId as string, payload),
    onSuccess: () => {
      if (!bedId) return;
      queryClient.invalidateQueries({ queryKey: ["bed-action-tasks", bedId] });
      queryClient.invalidateQueries({
        queryKey: ["action-tasks", "bed", bedId],
      });
      queryClient.invalidateQueries({ queryKey: ["harvest-prompts", bedId] });
      queryClient.invalidateQueries({ queryKey: ["bed-details", bedId] });
      queryClient.invalidateQueries({ queryKey: ["bed", bedId] });
      queryClient.invalidateQueries({ queryKey: bedKeys.detail(bedId) });
    },
  });
};
