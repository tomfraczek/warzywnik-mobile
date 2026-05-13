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

export const useGetMyTasks = (status: TaskStatusFilter = "pending") => {
  return useQuery({
    queryKey: ["me", "tasks", status],
    queryFn: () => getMyTasks(status),
    staleTime: ONE_MINUTE_MS,
    refetchOnMount: "always",
    retry: 1,
  });
};
