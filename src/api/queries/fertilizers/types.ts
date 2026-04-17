export type Fertilizer = {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  usage?: string | null;
  advantages?: string[] | null;
  disadvantages?: string[] | null;
  composition?: string[] | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type FertilizerListItem = {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
};
