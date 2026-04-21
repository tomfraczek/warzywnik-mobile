import { FavoriteItem } from "./types";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value: string) => UUID_REGEX.test(value);

export const getFavoriteDetailParam = (item: FavoriteItem): string | null => {
  if (item.targetType === "ARTICLE") {
    return item.targetSlug?.trim() || null;
  }

  const targetId = item.targetId?.trim();
  if (targetId) return targetId;

  const targetSlug = item.targetSlug?.trim();
  if (!targetSlug) return null;

  return isUuid(targetSlug) ? targetSlug : null;
};
