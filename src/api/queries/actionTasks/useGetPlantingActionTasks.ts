import { restClient } from "@/src/api/axios";
import { useQuery } from "@tanstack/react-query";
import { actionTaskKeys } from "./actionTaskKeys";
import {
  ActionTaskListResponse,
  TaskEntityStatusLike,
  TaskListStatusFilter,
  normalizeTaskListStatusFilter,
  resolveActionTaskList,
} from "./types";

const getPlantingActionTasks = async (
  plantingId: string,
  status?: TaskListStatusFilter,
): Promise<ActionTaskListResponse> => {
  const { data } = await restClient.get(
    `/plantings/${plantingId}/action-tasks`,
    {
      params: status ? { status } : undefined,
    },
  );

  return {
    items: resolveActionTaskList(data),
  };
};

export const useGetPlantingActionTasks = (
  plantingId: string | null,
  status?: TaskListStatusFilter | TaskEntityStatusLike,
) => {
  const normalizedStatus = normalizeTaskListStatusFilter(status);

  return useQuery({
    queryKey: actionTaskKeys.planting(plantingId as string, normalizedStatus),
    queryFn: () =>
      getPlantingActionTasks(plantingId as string, normalizedStatus),
    enabled: Boolean(plantingId),
  });
};
