export type Soil = {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  structure?: string | null;
  waterRetention?: string | null;
  drainage?: string | null;
  phMin?: number | null;
  phMax?: number | null;
  fertilityLevel?: string | null;
  advantages?: string[] | null;
  disadvantages?: string[] | null;
  improvementTips?: string[] | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type SoilListItem = {
  id: string;
  name: string;
  slug?: string | null;
};
