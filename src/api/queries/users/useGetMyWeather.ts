import { restClient } from "@/src/api/axios";
import { useQuery } from "@tanstack/react-query";
import { WeatherResponse } from "./meTypes";

const FIVE_MINUTES_MS = 1000 * 60 * 5;

const getMyWeather = async (): Promise<WeatherResponse> => {
  const { data } = await restClient.get<WeatherResponse>("/users/me/weather");
  return data;
};

export const useGetMyWeather = () => {
  return useQuery({
    queryKey: ["me", "weather"],
    queryFn: getMyWeather,
    staleTime: FIVE_MINUTES_MS,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    retry: 1,
  });
};
