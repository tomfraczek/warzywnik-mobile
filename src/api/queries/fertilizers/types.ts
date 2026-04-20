export type Fertilizer = {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  category?: string | null;
  form?: string | null;
  applicationMethod?: string | null;
  riskLevel?: string | null;
  nitrogenEffect?: string | null;
  phosphorusEffect?: string | null;
  potassiumEffect?: string | null;
  phEffect?: string | null;
  soilStructureEffect?: string | null;
  waterRetentionEffect?: string | null;
  drainageEffect?: string | null;
  recommendedFrequency?: string | null;
  dosageGuidance?: string | null;
  notes?: string | null;
  isActive?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type FertilizerListItem = Fertilizer;
