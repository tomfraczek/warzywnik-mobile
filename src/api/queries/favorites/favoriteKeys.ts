import { FavoriteTargetType } from "./types";

export const favoriteKeys = {
  all: ["favorites"] as const,
  grouped: () => ["favorites", "grouped"] as const,
  list: (targetType?: FavoriteTargetType) =>
    ["favorites", "list", targetType] as const,
};
