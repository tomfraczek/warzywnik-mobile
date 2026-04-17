export type Disease = {
  id: string;
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
  name: string;
  description?: string | null;
};
