export type SoilSummary = {
  id: string;
  name: string;
};

export type CultivationEnvironment =
  | "GROUND_OUTDOOR"
  | "RAISED_BED_OUTDOOR"
  | "POT_OUTDOOR"
  | "POT_INDOOR"
  | "GREENHOUSE"
  | "TUNNEL";

export type Bed = {
  id: string;
  name: string;
  description?: string | null;
  locationLabel?: string | null;
  depthCm?: number | null;
  cultivationEnvironment?: CultivationEnvironment | null;
  soilId?: string | null;
  soil?: SoilSummary | null;
  soilTestingEnabled?: boolean | null;
  measuredN?: number | null;
  measuredP?: number | null;
  measuredK?: number | null;
  measuredPh?: number | null;
  isActive?: boolean | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateBedDto = {
  name: string;
  description?: string;
  locationLabel?: string;
  depthCm?: number;
  cultivationEnvironment?: CultivationEnvironment;
  soilId?: string | null;
  soilTestingEnabled?: boolean;
  measuredN?: number | null;
  measuredP?: number | null;
  measuredK?: number | null;
  measuredPh?: number | null;
  isActive?: boolean;
};

export type UpdateBedDto = Partial<CreateBedDto>;
