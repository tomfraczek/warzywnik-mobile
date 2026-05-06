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

type BedActionTaskScope = "own" | "includingChildren";

const getBedActionTasks = async (
  bedId: string,
  status?: TaskListStatusFilter,
  range?: ActionTaskRangeParams,
  scope?: BedActionTaskScope,
): Promise<ActionTaskListResponse> => {
  const { data } = await restClient.get(`/beds/${bedId}/action-tasks`, {
    params:
      status || range?.from || range?.to || scope
        ? {
            ...(status ? { status } : {}),
            ...(range?.from ? { from: range.from } : {}),
            ...(range?.to ? { to: range.to } : {}),
            ...(scope ? { scope } : {}),
          }
        : undefined,
  });

  return {
    items: resolveActionTaskList(data),
  };
};

export const useGetBedActionTasks = (
  bedId: string | null,
  status?: TaskListStatusFilter | TaskEntityStatusLike,
  range?: ActionTaskRangeParams,
  scope?: BedActionTaskScope,
) => {
  const normalizedStatus = normalizeTaskListStatusFilter(status);

  return useQuery({
    queryKey: actionTaskKeys.bed(
      bedId as string,
      normalizedStatus,
      range,
      scope,
    ),
    queryFn: () =>
      getBedActionTasks(bedId as string, normalizedStatus, range, scope),
    enabled: Boolean(bedId),
  });
};
