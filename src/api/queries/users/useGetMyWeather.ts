import { restClient } from "@/src/api/axios";
import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";
import { WeatherResponse } from "./meTypes";

const getMyWeather = async (
  token: string,
): Promise<WeatherResponse> => {
  const { data } = await restClient.get<WeatherResponse>("/users/me/weather", {
    timeout: 15000,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

export const useGetMyWeather = () => {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  return useQuery({
    queryKey: ["me", "weather"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        throw new Error("Brak tokena autoryzacji");
      }
      return getMyWeather(token);
    },
    enabled: Boolean(isLoaded && isSignedIn),
    staleTime: 0,
    gcTime: 24 * 60 * 60 * 1000, // keep last known data for 24h
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 1,
  });
};
