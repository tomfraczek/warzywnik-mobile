import { restClient } from "@/src/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { favoriteKeys } from "./favoriteKeys";
import { AddFavoriteBody, AddFavoriteResponse } from "./types";

const addFavorite = async (
  body: AddFavoriteBody,
): Promise<AddFavoriteResponse> => {
  const { data } = await restClient.post<AddFavoriteResponse>(
    "/users/me/favorites",
    body,
  );
  return data;
};

export const useAddFavorite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addFavorite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: favoriteKeys.all });
    },
  });
};
