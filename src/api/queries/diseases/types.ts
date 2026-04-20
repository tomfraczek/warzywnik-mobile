export type Disease = {
  id: string;
  slug?: string | null;
  name: string;
  description?: string | null;
  symptoms?: string[] | null;
  treatment?: string[] | null;
  prevention?: string[] | null;
  affectedPlants?: string[] | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type DiseaseListItem = {
  id: string;
  slug?: string | null;
  name: string;
  description?: string | null;
};
