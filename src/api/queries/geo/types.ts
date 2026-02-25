export type LocationMode = "MANUAL" | "DEVICE";

export type GeoSearchItem = {
  placeId: string;
  label: string;
  lat: number;
  lon: number;
};

export type GeoSearchResult = GeoSearchItem;

export type GeoReverseResult = {
  label: string;
};

export type UpdateLocationPreferencePayload =
  | {
      mode: "MANUAL";
      label: string;
      lat: number;
      lon: number;
      providerPlaceId?: string;
    }
  | {
      mode: "DEVICE";
      label: string;
      lat: number;
      lon: number;
      accuracyM?: number;
    };

export type UpdateLocationPreferenceResponse = {
  location?: {
    label: string;
    lat: number;
    lon: number;
    mode: LocationMode;
    providerPlaceId?: string;
    accuracyM?: number;
    updatedAt: string | number;
  };
};
