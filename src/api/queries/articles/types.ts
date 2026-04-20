export type ArticleListItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl: string | null;
  coverUpdatedAt: string | null;
  readTimeMinutes: number | null;
  months: number[];
  seasons: string[];
  contexts: string[];
  priority: number;
  publishedAt: string | null;
};

export type Article = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImageUrl: string | null;
  coverUpdatedAt: string | null;
  readTimeMinutes: number | null;
  months: number[];
  seasons: string[];
  contexts: string[];
  priority: number;
  publishedAt: string | null;
  relatedVegetableIds: string[];
  relatedSoilIds: string[];
  relatedFertilizerIds: string[];
  relatedDiseaseIds: string[];
  relatedPestIds: string[];
};

export type ArticlesListResponse = {
  items: ArticleListItem[];
  page: number;
  limit: number;
  total: number;
};
