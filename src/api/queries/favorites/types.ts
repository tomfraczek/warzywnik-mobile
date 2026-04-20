export type FavoriteTargetType =
  | "ARTICLE"
  | "VEGETABLE"
  | "SOIL"
  | "DISEASE"
  | "PEST"
  | "FERTILIZER";

export type FavoriteItem = {
  id: string;
  targetType: FavoriteTargetType;
  targetSlug: string;
  createdAt: string;
  /** Returned when ?include=details is used */
  imageUrl?: string | null;
  name?: string | null;
};

export type AddFavoriteBody = {
  targetType: FavoriteTargetType;
  targetSlug: string;
};

export type AddFavoriteResponse = {
  created: boolean;
  item: FavoriteItem;
};

export type FavoritesListResponse = {
  items: FavoriteItem[];
  page: number;
  limit: number;
  total: number;
};

export type FavoritesGroupedResponse = Partial<
  Record<FavoriteTargetType, FavoriteItem[]>
>;
