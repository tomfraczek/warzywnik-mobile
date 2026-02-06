export type Pest = {
  id: string;
  name: string;
  description?: string | null;
  symptoms?: string[] | null;
  treatment?: string[] | null;
  prevention?: string[] | null;
  affectedPlants?: string[] | null;
};

export type PestListItem = {
  id: string;
  name: string;
  description?: string | null;
};
