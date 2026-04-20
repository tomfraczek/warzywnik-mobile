import { useCallback, useEffect, useState } from "react";
import { FavoriteTargetType } from "./types";
import { useAddFavorite } from "./useAddFavorite";
import { useGetFavoritesGrouped } from "./useGetFavoritesGrouped";
import { useRemoveFavorite } from "./useRemoveFavorite";

/**
 * Hook that provides toggle-favorite behavior for a given target.
 * Uses the grouped favorites cache as source of truth.
 */
export const useFavoriteToggle = (
  targetType: FavoriteTargetType,
  targetSlug: string | null | undefined,
) => {
  const { data: grouped, isLoading: isLoadingGrouped } =
    useGetFavoritesGrouped();
  const addMutation = useAddFavorite();
  const removeMutation = useRemoveFavorite();

  const serverFavorited =
    grouped?.[targetType]?.some((item) => item.targetSlug === targetSlug) ??
    false;

  const [optimistic, setOptimistic] = useState<boolean | null>(null);

  // Sync local state when server state resolves
  useEffect(() => {
    if (!isLoadingGrouped) {
      setOptimistic(null);
    }
  }, [isLoadingGrouped, serverFavorited]);

  const isFavorited = optimistic !== null ? optimistic : serverFavorited;

  const isBusy =
    addMutation.isPending || removeMutation.isPending || isLoadingGrouped;

  const toggle = useCallback(() => {
    if (!targetSlug || isBusy) return;

    const next = !isFavorited;
    setOptimistic(next);

    if (next) {
      addMutation.mutate(
        { targetType, targetSlug },
        {
          onError: () => setOptimistic(!next),
        },
      );
    } else {
      removeMutation.mutate(
        { targetType, targetSlug },
        {
          onError: () => setOptimistic(!next),
        },
      );
    }
  }, [
    targetSlug,
    isBusy,
    isFavorited,
    targetType,
    addMutation,
    removeMutation,
  ]);

  return { isFavorited, toggle, isBusy, isAvailable: !!targetSlug };
};
