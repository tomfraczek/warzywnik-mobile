import { restClient } from "@/src/api/axios";
import { useQuery } from "@tanstack/react-query";
import { TaskStatusFilter, TasksResponse } from "./meTypes";

const ONE_MINUTE_MS = 1000 * 60;

const getMyTasks = async (
  status: TaskStatusFilter = "pending",
): Promise<TasksResponse> => {
  const { data } = await restClient.get<TasksResponse>("/users/me/tasks", {
    params: { status },
  });
  return data;
};

type UseGetMyTasksOptions = {
  enabled?: boolean;
};

export const useGetMyTasks = (
  status: TaskStatusFilter = "pending",
  options?: UseGetMyTasksOptions,
) => {
  return useQuery({
    queryKey: ["me", "tasks", status],
    queryFn: () => getMyTasks(status),
    enabled: options?.enabled ?? true,
    staleTime: ONE_MINUTE_MS,
    refetchOnMount: "always",
    retry: 1,
  });
};
