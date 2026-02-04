export type SoilSummary = {
  id: string;
  name: string;
};

export type Bed = {
  id: string;
  name: string;
  description?: string | null;
  locationLabel?: string | null;
  lengthCm?: number | null;
  widthCm?: number | null;
  depthCm?: number | null;
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
  lengthCm?: number;
  widthCm?: number;
  depthCm?: number;
  soilId?: string | null;
  soilTestingEnabled?: boolean;
  measuredN?: number | null;
  measuredP?: number | null;
  measuredK?: number | null;
  measuredPh?: number | null;
  isActive?: boolean;
};

export type UpdateBedDto = Partial<CreateBedDto>;
