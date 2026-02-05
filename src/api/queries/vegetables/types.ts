export type Month =
  | "january"
  | "february"
  | "march"
  | "april"
  | "may"
  | "june"
  | "july"
  | "august"
  | "september"
  | "october"
  | "november"
  | "december";

export type DemandLevel = "low" | "medium" | "high";
export type SunExposure = "full_sun" | "partial_shade" | "shade";
export type SoilType =
  | "SANDY"
  | "LOAMY"
  | "CLAY"
  | "SILT"
  | "PEAT"
  | "CHALK"
  | "COMPOST_RICH"
  | "OTHER";
export type SowingMethodType = "direct_sow" | "seedlings";
export type DominantNutrientDemand = "N" | "P" | "K" | "BALANCED";

export type SowingMethod = {
  method: SowingMethodType;
  startMonth: Month;
  endMonth: Month;
  underCover: boolean;
  germinationDaysMin: number | null;
  germinationDaysMax: number | null;
  seedDepthCm: number | null;
  rowSpacingCm: number | null;
  plantSpacingCm: number | null;
  transplantingStartMonth: Month | null;
  transplantingEndMonth: Month | null;
};

export type FertilizationStage = {
  name: string;
  timing: string | null;
  description: string;
};

export type MiniRef = {
  id: string;
  slug: string;
  name: string;
};

export type Vegetable = {
  id: string;
  slug: string;
  name: string;
  latinName: string | null;
  imageUrl: string | null;
  description: string;
  sunExposure: SunExposure | null;
  waterDemand: DemandLevel | null;
  nutrientDemand: DemandLevel | null;
  recommendedSoilIds: string[];
  minSoilDepthCm: number | null;
  dominantNutrientDemand: DominantNutrientDemand | null;
  sowingMethods: SowingMethod[] | null;
  timeToHarvestDaysMin: number | null;
  timeToHarvestDaysMax: number | null;
  successionSowing: boolean;
  successionIntervalDays: number | null;
  harvestStartMonth: Month | null;
  harvestEndMonth: Month | null;
  harvestSigns: string | null;
  fertilizationStages: FertilizationStage[] | null;
  commonPests: MiniRef[];
  commonDiseases: MiniRef[];
  goodCompanions: MiniRef[];
  badCompanions: MiniRef[];
  createdAt: string;
  updatedAt: string;
};

export type VegetableListItem = {
  id: string;
  slug: string;
  name: string;
  latinName: string | null;
  imageUrl: string | null;
  description: string | null;
};
