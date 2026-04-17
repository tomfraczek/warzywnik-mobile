export type Pest = {
  id: string;
  slug?: string | null;
  name: string;
  description?: string | null;
  symptoms?: string | string[] | null;
  treatment?: string | string[] | null;
  prevention?: string | string[] | null;
  recommendedActionTemplateIds?: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type ListPestsResponse = {
  items: Pest[];
  page: number;
  limit: number;
  total: number;
};
