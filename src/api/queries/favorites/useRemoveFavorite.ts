import { restClient } from "@/src/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { favoriteKeys } from "./favoriteKeys";
import { FavoriteTargetType } from "./types";

type RemoveFavoriteParams = {
  targetType: FavoriteTargetType;
  targetSlug: string;
};

const removeFavorite = async ({
  targetType,
  targetSlug,
}: RemoveFavoriteParams): Promise<void> => {
  await restClient.delete(`/users/me/favorites/${targetType}/${targetSlug}`);
};

export const useRemoveFavorite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeFavorite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: favoriteKeys.all });
    },
  });
};
