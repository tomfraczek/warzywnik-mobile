export type AnalyticsEventType =
  | "ARTICLE_VIEW"
  | "ARTICLE_ENGAGED"
  | "ARTICLE_SCROLL_50"
  | "ARTICLE_SCROLL_90"
  | "VEGETABLE_ADDED_TO_BED";

export type AnalyticsTargetType = "ARTICLE" | "VEGETABLE";

export type AnalyticsEvent = {
  eventType: AnalyticsEventType;
  targetType: AnalyticsTargetType;
  targetSlug: string;
  sessionId?: string;
  idempotencyKey?: string;
  occurredAt?: string;
  valueInt?: number;
  valueNum?: number;
  metadata?: Record<string, unknown>;
};

export type TrackEventsResponse = {
  total: number;
  accepted: number;
  duplicates: number;
};

// ─── Popular vegetables ──────────────────────────────────────────────────────

export type PopularVegetableSortBy = "adds" | "favorites";

export type PopularVegetablesParams = {
  limit?: number;
  sort?: PopularVegetableSortBy;
  windowDays?: number;
};

export type PopularVegetableItem = {
  vegetableSlug: string;
  addCountTotal: number;
  addCountWindow?: number;
  favoriteCount: number;
  lastAddedAt: string | null;
  vegetable: {
    id: string;
    name: string;
    imageUrl: string | null;
  };
};

export type PopularVegetablesResponse = {
  items: PopularVegetableItem[];
};

// ─── Popular articles ─────────────────────────────────────────────────────────

export type PopularArticleSortBy =
  | "views"
  | "engagedSeconds"
  | "scroll50"
  | "scroll90"
  | "favorites";

export type PopularArticlesParams = {
  limit?: number;
  sort?: PopularArticleSortBy;
};

export type PopularArticleItem = {
  articleSlug: string;
  viewsTotal: number;
  engagedSecondsTotal: number;
  scroll50Count: number;
  scroll90Count: number;
  favoriteCount: number;
  article: {
    id: string;
    title: string;
    excerpt: string;
    coverImageUrl: string | null;
    publishedAt: string | null;
  };
};

export type PopularArticlesResponse = {
  items: PopularArticleItem[];
};
