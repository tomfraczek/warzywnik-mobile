import {
  Bed,
  CreateBedDto,
  CultivationEnvironment,
  UpdateBedDto,
} from "@/src/api/queries/beds/types";

export type BedFormValues = {
  name: string;
  description: string;
  locationLabel: string;
  depthCm: string;
  cultivationEnvironment: CultivationEnvironment;
  soilId: string | null;
  soilName: string | null;
  isActive: boolean;
  soilTestingEnabled: boolean;
  measuredN: string;
  measuredP: string;
  measuredK: string;
  measuredPh: string;
};

export const createEmptyBedFormValues = (): BedFormValues => ({
  name: "",
  description: "",
  locationLabel: "",
  depthCm: "",
  cultivationEnvironment: "GROUND_OUTDOOR",
  soilId: null,
  soilName: null,
  isActive: true,
  soilTestingEnabled: false,
  measuredN: "",
  measuredP: "",
  measuredK: "",
  measuredPh: "",
});

export const bedToFormValues = (bed: Bed): BedFormValues => ({
  name: bed.name ?? "",
  description: bed.description ?? "",
  locationLabel: bed.locationLabel ?? "",
  depthCm: bed.depthCm != null ? String(bed.depthCm) : "",
  cultivationEnvironment: bed.cultivationEnvironment ?? "GROUND_OUTDOOR",
  soilId: bed.soilId ?? bed.soil?.id ?? null,
  soilName: bed.soil?.name ?? (bed as any)?.soilName ?? null,
  isActive: bed.isActive ?? true,
  soilTestingEnabled: bed.soilTestingEnabled ?? false,
  measuredN: bed.measuredN != null ? String(bed.measuredN) : "",
  measuredP: bed.measuredP != null ? String(bed.measuredP) : "",
  measuredK: bed.measuredK != null ? String(bed.measuredK) : "",
  measuredPh: bed.measuredPh != null ? String(bed.measuredPh) : "",
});

const normalizeText = (value: string) => value.trim();

const toOptionalNumber = (value: string): number | null => {
  const trimmed = value.trim().replace(",", ".");
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
};

const validateOptionalNumber = (label: string, value: string) => {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(",", "."));
  if (Number.isNaN(parsed)) return `Nieprawidłowa wartość w polu: ${label}`;
  if (parsed < 0) return `Wartość w polu ${label} nie może być ujemna`;
  if (parsed > 100 && ["N", "P", "K"].includes(label)) {
    return `Wartość w polu ${label} musi być w zakresie 0-100`;
  }
  return null;
};

export const validateBedForm = (values: BedFormValues): string | null => {
  if (!normalizeText(values.name)) {
    return "Podaj nazwę grządki";
  }

  const numericErrors = [
    validateOptionalNumber("Głębokość", values.depthCm),
    validateOptionalNumber("N", values.measuredN),
    validateOptionalNumber("P", values.measuredP),
    validateOptionalNumber("K", values.measuredK),
  ].filter(Boolean) as string[];

  if (numericErrors.length > 0) return numericErrors[0];

  if (values.measuredPh.trim()) {
    const ph = Number(values.measuredPh.replace(",", "."));
    if (Number.isNaN(ph)) return "Nieprawidłowa wartość w polu: pH";
    if (ph < 0 || ph > 14) return "pH musi mieścić się w zakresie 0-14";
  }

  return null;
};

export const buildCreateBedPayload = (values: BedFormValues): CreateBedDto => {
  const payload: CreateBedDto = {
    name: normalizeText(values.name),
    isActive: true,
    soilTestingEnabled: values.soilTestingEnabled,
  };

  const description = normalizeText(values.description);
  if (description) payload.description = description;

  const locationLabel = normalizeText(values.locationLabel);
  if (locationLabel) payload.locationLabel = locationLabel;

  const depthCm = toOptionalNumber(values.depthCm);
  if (depthCm != null) payload.depthCm = depthCm;

  payload.cultivationEnvironment = values.cultivationEnvironment;

  if (values.soilId) payload.soilId = values.soilId;

  if (values.soilTestingEnabled) {
    const measuredN = toOptionalNumber(values.measuredN);
    const measuredP = toOptionalNumber(values.measuredP);
    const measuredK = toOptionalNumber(values.measuredK);
    const measuredPh = toOptionalNumber(values.measuredPh);
    if (measuredN != null) payload.measuredN = measuredN;
    if (measuredP != null) payload.measuredP = measuredP;
    if (measuredK != null) payload.measuredK = measuredK;
    if (measuredPh != null) payload.measuredPh = measuredPh;
  }

  return payload;
};

const normalizeComparable = (values: BedFormValues) => ({
  name: normalizeText(values.name) || null,
  description: normalizeText(values.description) || null,
  locationLabel: normalizeText(values.locationLabel) || null,
  depthCm: toOptionalNumber(values.depthCm),
  cultivationEnvironment: values.cultivationEnvironment,
  soilId: values.soilId ?? null,
  soilTestingEnabled: values.soilTestingEnabled,
  measuredN: toOptionalNumber(values.measuredN),
  measuredP: toOptionalNumber(values.measuredP),
  measuredK: toOptionalNumber(values.measuredK),
  measuredPh: toOptionalNumber(values.measuredPh),
});

export const buildUpdateBedPayload = (
  initial: BedFormValues,
  current: BedFormValues,
): UpdateBedDto => {
  const initialNormalized = normalizeComparable(initial);
  const currentNormalized = normalizeComparable(current);
  const payload: UpdateBedDto = {};

  Object.keys(initialNormalized).forEach((key) => {
    const typedKey = key as keyof typeof initialNormalized;
    if (initialNormalized[typedKey] !== currentNormalized[typedKey]) {
      (payload as any)[key] = currentNormalized[typedKey] as any;
    }
  });

  if (!currentNormalized.soilTestingEnabled) {
    if (initialNormalized.measuredN != null) payload.measuredN = null;
    if (initialNormalized.measuredP != null) payload.measuredP = null;
    if (initialNormalized.measuredK != null) payload.measuredK = null;
    if (initialNormalized.measuredPh != null) payload.measuredPh = null;
  }

  return payload;
};
