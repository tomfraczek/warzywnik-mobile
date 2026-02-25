import { restClient } from "@/src/api/axios";
import { useQuery } from "@tanstack/react-query";
import { WarningsResponse } from "./meTypes";

const ONE_MINUTE_MS = 1000 * 60;

const getMyWarnings = async (): Promise<WarningsResponse> => {
  const { data } = await restClient.get<WarningsResponse>("/users/me/warnings");
  return data;
};

export const useGetMyWarnings = () => {
  return useQuery({
    queryKey: ["me", "warnings"],
    queryFn: getMyWarnings,
    staleTime: ONE_MINUTE_MS,
    refetchOnMount: "always",
    retry: 1,
  });
};
