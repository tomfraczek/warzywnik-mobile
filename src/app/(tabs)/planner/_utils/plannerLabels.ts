import { BadgeTone } from "@/src/components/ui/StatusBadge";

export const sourceLabelMap: Record<string, string> = {
  MANUAL: "Ręczne",
  VEGETABLE_RULE: "Z uprawy",
  WEATHER_WARNING: "Pogoda",
};

export const sourceTypeLabelMap: Record<string, string> = {
  MANUAL: "Ręczne",
  AUTOMATION: "Automatyczne",
  SUGGESTION: "Sugestia",
};

export const targetTypeLabelMap: Record<string, string> = {
  user: "Cały ogród",
  bed: "Grządka",
  planting: "Uprawa",
  space: "Przestrzeń",
};

export const taskStatusLabelMap: Record<string, string> = {
  pending: "Do zrobienia",
  done: "Wykonane",
  canceled: "Anulowane",
};

export const actionKindLabelMap: Record<string, string> = {
  WATERING: "Podlewanie",
  MOISTURE_CHECK: "Kontrola wilgotności",
  FERTILIZATION: "Nawożenie",
  PEST_CHECK: "Kontrola szkodników",
  DISEASE_CHECK: "Kontrola chorób",
  WEEDING: "Pielenie",
  HARVEST: "Zbiór",
};

export const getSourceTone = (source?: string | null): BadgeTone => {
  const normalized = source?.toUpperCase();
  if (normalized === "WEATHER_WARNING") return "info";
  if (normalized === "VEGETABLE_RULE") return "success";
  if (normalized === "MANUAL") return "neutral";
  return "neutral";
};

export const getSourceLabel = (params: {
  source?: string | null;
  sourceType?: string | null;
}) => {
  const source = params.source?.toUpperCase() ?? "";
  if (sourceLabelMap[source]) return sourceLabelMap[source];

  const sourceType = params.sourceType?.toUpperCase() ?? "";
  if (sourceTypeLabelMap[sourceType]) return sourceTypeLabelMap[sourceType];

  return "Zadanie";
};
