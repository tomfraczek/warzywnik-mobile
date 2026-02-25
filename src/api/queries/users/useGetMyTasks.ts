import { restClient } from "@/src/api/axios";
import { useQuery } from "@tanstack/react-query";
import { TasksResponse } from "./meTypes";

const ONE_MINUTE_MS = 1000 * 60;

const getMyTasks = async (): Promise<TasksResponse> => {
  const { data } = await restClient.get<TasksResponse>("/users/me/tasks");
  return data;
};

export const useGetMyTasks = () => {
  return useQuery({
    queryKey: ["me", "tasks"],
    queryFn: getMyTasks,
    staleTime: ONE_MINUTE_MS,
    refetchOnMount: "always",
    retry: 1,
  });
};
