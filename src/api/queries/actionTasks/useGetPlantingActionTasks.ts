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

type ActionTaskRangeParams = {
  from?: string;
  to?: string;
};

const getPlantingActionTasks = async (
  plantingId: string,
  status?: TaskListStatusFilter,
  range?: ActionTaskRangeParams,
): Promise<ActionTaskListResponse> => {
  const { data } = await restClient.get(
    `/plantings/${plantingId}/action-tasks`,
    {
      params:
        status || range?.from || range?.to
          ? {
              ...(status ? { status } : {}),
              ...(range?.from ? { from: range.from } : {}),
              ...(range?.to ? { to: range.to } : {}),
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
) => {
  const normalizedStatus = normalizeTaskListStatusFilter(status);

  return useQuery({
    queryKey: actionTaskKeys.planting(
      plantingId as string,
      normalizedStatus,
      range,
    ),
    queryFn: () =>
      getPlantingActionTasks(plantingId as string, normalizedStatus, range),
    enabled: Boolean(plantingId),
  });
};
