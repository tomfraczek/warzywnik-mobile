import { restClient } from "@/src/api/axios";
import { useQuery } from "@tanstack/react-query";
import { favoriteKeys } from "./favoriteKeys";
import { FavoritesGroupedResponse } from "./types";

const getFavoritesGrouped = async (): Promise<FavoritesGroupedResponse> => {
  const { data } = await restClient.get<FavoritesGroupedResponse>(
    "/users/me/favorites/grouped",
  );
  return data;
};

export const useGetFavoritesGrouped = () => {
  return useQuery({
    queryKey: favoriteKeys.grouped(),
    queryFn: getFavoritesGrouped,
    staleTime: 2 * 60 * 1000, // 2 min
  });
};
