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

const getBedActionTasks = async (
  bedId: string,
  status?: TaskListStatusFilter,
): Promise<ActionTaskListResponse> => {
  const { data } = await restClient.get(`/beds/${bedId}/action-tasks`, {
    params: status ? { status } : undefined,
  });

  return {
    items: resolveActionTaskList(data),
  };
};

export const useGetBedActionTasks = (
  bedId: string | null,
  status?: TaskListStatusFilter | TaskEntityStatusLike,
) => {
  const normalizedStatus = normalizeTaskListStatusFilter(status);

  return useQuery({
    queryKey: actionTaskKeys.bed(bedId as string, normalizedStatus),
    queryFn: () => getBedActionTasks(bedId as string, normalizedStatus),
    enabled: Boolean(bedId),
  });
};
