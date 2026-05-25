import { restClient } from "@/src/api/axios";
import { useQuery } from "@tanstack/react-query";
import { actionTaskKeys, PlantingTaskMode } from "./actionTaskKeys";
import {
  ActionTaskListResponse,
  normalizeTaskListStatusFilter,
  resolveActionTaskList,
  TaskEntityStatusLike,
  TaskListStatusFilter,
} from "./types";

type ActionTaskRangeParams = {
  from?: string;
  to?: string;
};

const getPlantingActionTasks = async (
  plantingId: string,
  status?: TaskListStatusFilter,
  range?: ActionTaskRangeParams,
  mode?: PlantingTaskMode,
): Promise<ActionTaskListResponse> => {
  const { data } = await restClient.get(
    `/plantings/${plantingId}/action-tasks`,
    {
      params:
        status || range?.from || range?.to || mode
          ? {
              ...(status ? { status } : {}),
              ...(range?.from ? { from: range.from } : {}),
              ...(range?.to ? { to: range.to } : {}),
              ...(mode ? { mode } : {}),
            }
          : undefined,
    },
  );

  return {
    items: resolveActionTaskList(data),
  };
};

export const useGetPlantingActionTasks = (
  plantingId: string | null,
  status?: TaskListStatusFilter | TaskEntityStatusLike,
  range?: ActionTaskRangeParams,
  mode?: PlantingTaskMode,
) => {
  const normalizedStatus = normalizeTaskListStatusFilter(status);

  return useQuery({
    queryKey: actionTaskKeys.planting(
      plantingId as string,
      normalizedStatus,
      range,
      mode,
    ),
    queryFn: () =>
      getPlantingActionTasks(
        plantingId as string,
        normalizedStatus,
        range,
        mode,
      ),
    enabled: Boolean(plantingId),
  });
};
