import { restClient } from "@/src/api/axios";
import { useQuery } from "@tanstack/react-query";
import { WeatherResponse } from "./meTypes";

const getMyWeather = async (): Promise<WeatherResponse> => {
  const { data } = await restClient.get<WeatherResponse>("/users/me/weather");
  return data;
};

export const useGetMyWeather = () => {
  return useQuery({
    queryKey: ["me", "weather"],
    queryFn: getMyWeather,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: false,
  });
};
