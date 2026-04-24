import type {
  PlantingEventType,
  TimelineItem,
} from "@/src/api/queries/plantings/learningTypes";
import { PlantingStatus } from "@/src/api/queries/plantings/types";
import { getPlantingStatusLabel } from "@/src/features/plantings/status";

// ─── Date formatters ────────────────────────────────────────────────────────

export const formatLocalDate = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
};

export const formatLocalDateTime = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const date = formatLocalDate(iso);
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${date}, ${hours}:${minutes}`;
};

// ─── Yield & rating ──────────────────────────────────────────────────────────

export const formatYield = (kg: number | null | undefined): string => {
  if (kg === null || kg === undefined) return "Brak danych";
  return `${kg % 1 === 0 ? kg : kg.toFixed(1)} kg`;
};

export const formatQualityRating = (
  rating: number | null | undefined,
): string => {
  if (rating === null || rating === undefined) return "Brak oceny";
  const filled = "★".repeat(rating);
  const empty = "☆".repeat(5 - rating);
  return `${filled}${empty}  (${rating}/5)`;
};

// ─── Season diff texts ────────────────────────────────────────────────────────

export const formatStartDiff = (days: number | null): string | null => {
  if (days === null || days === undefined) return null;
  if (days > 0) return `Start później o ${days} dni`;
  if (days < 0) return `Start wcześniej o ${Math.abs(days)} dni`;
  return "Start w tym samym czasie";
};

export const formatDurationDiff = (days: number | null): string | null => {
  if (days === null || days === undefined) return null;
  if (days > 0) return `Sezon dłuższy o ${days} dni`;
  if (days < 0) return `Sezon krótszy o ${Math.abs(days)} dni`;
  return "Sezon tej samej długości";
};

export const formatYieldDiff = (kg: number | null): string | null => {
  if (kg === null || kg === undefined) return null;
  if (kg > 0) return `Plon większy o ${kg % 1 === 0 ? kg : kg.toFixed(1)} kg`;
  if (kg < 0)
    return `Plon mniejszy o ${Math.abs(kg) % 1 === 0 ? Math.abs(kg) : Math.abs(kg).toFixed(1)} kg`;
  return "Plon taki sam";
};

export const formatTaskCountDiff = (count: number | null): string | null => {
  if (count === null || count === undefined) return null;
  if (count > 0) return `Więcej zabiegów o ${count}`;
  if (count < 0) return `Mniej zabiegów o ${Math.abs(count)}`;
  return "Tyle samo zabiegów";
};

// ─── Status / severity labels ────────────────────────────────────────────────

export const mapOccurrenceStatusToLabel = (status: string): string => {
  const labels: Record<string, string> = {
    suspected: "Podejrzenie",
    confirmed: "Potwierdzone",
    resolved: "Opanowane",
  };
  return labels[status] ?? status;
};

export const mapDiseaseSeverityToLabel = (severity: string): string => {
  const labels: Record<string, string> = {
    low: "Nasilenie niskie",
    medium: "Nasilenie umiarkowane",
    high: "Nasilenie silne",
  };
  return labels[severity.toLowerCase()] ?? severity;
};

// ─── Planting event labels ────────────────────────────────────────────────────

export const mapPlantingEventTypeToLabel = (
  eventType: PlantingEventType,
): string => {
  const labels: Record<PlantingEventType, string> = {
    PLANTING_CREATED: "Utworzono uprawę",
    PLANTING_SOWED: "Wykonano siew",
    PLANTING_TRANSPLANTED: "Przesadzono rozsadę",
    PLANTING_STARTED: "Rozpoczęto uprawę",
    PLANTING_STATUS_CHANGED: "Zmieniono status uprawy",
    PLANTING_CANCELLED: "Anulowano uprawę",
    PLANTING_HARVEST_STARTED: "Rozpoczęto zbiór",
    PLANTING_HARVEST_FINISHED: "Zakończono zbiór",
    PLANTING_ACTION_COMPLETED: "Wykonano zabieg",
  };
  return labels[eventType] ?? eventType;
};

export const getPlantingEventTypeIcon = (
  eventType: PlantingEventType,
): string => {
  const icons: Record<PlantingEventType, string> = {
    PLANTING_CREATED: "plus-circle-outline",
    PLANTING_SOWED: "seed-outline",
    PLANTING_TRANSPLANTED: "transfer",
    PLANTING_STARTED: "play-circle-outline",
    PLANTING_STATUS_CHANGED: "swap-horizontal",
    PLANTING_CANCELLED: "close-circle-outline",
    PLANTING_HARVEST_STARTED: "basket-outline",
    PLANTING_HARVEST_FINISHED: "basket",
    PLANTING_ACTION_COMPLETED: "check-circle-outline",
  };
  return icons[eventType] ?? "calendar-outline";
};

// ─── Action type labels ───────────────────────────────────────────────────────

export const mapActionTypeToLabel = (actionType: string | null): string => {
  if (!actionType) return "Zabieg";
  const labels: Record<string, string> = {
    WATERING: "Podlewanie",
    FERTILIZATION: "Nawożenie",
    PROTECTION: "Zabieg ochronny",
    SOWING: "Siew",
    TRANSPLANTING: "Przesadzanie",
    PRUNING: "Przycinanie",
    SOIL_WORK: "Praca glebowa",
    HARVEST: "Zbiór",
    INSPECTION: "Inspekcja",
  };
  return labels[actionType.toUpperCase()] ?? actionType;
};

export const getActionTypeIcon = (actionType: string | null): string => {
  if (!actionType) return "check-circle-outline";
  const icons: Record<string, string> = {
    WATERING: "water-outline",
    FERTILIZATION: "leaf",
    PROTECTION: "shield-check-outline",
    SOWING: "seed-outline",
    TRANSPLANTING: "transfer",
    PRUNING: "content-cut",
    SOIL_WORK: "shovel",
    HARVEST: "basket-outline",
    INSPECTION: "magnify",
  };
  return icons[actionType.toUpperCase()] ?? "check-circle-outline";
};

// ─── Timeline presentation ────────────────────────────────────────────────────

export type TimelineItemPresentation = {
  icon: string;
  iconColor?: "default" | "warning" | "danger";
  title: string;
  subtitle?: string;
};

const parsePlantingStatus = (value: unknown): PlantingStatus | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  const validStatuses: PlantingStatus[] = [
    "NEW",
    "SEEDLING_PREPARED",
    "SEEDLING_READY_FOR_TRANSPLANT",
    "IN_GROUND",
    "READY_FOR_FINAL_HARVEST",
    "HARVESTED",
    "CLEARED",
    "FAILED",
    "CANCELLED",
  ];
  return validStatuses.includes(normalized as PlantingStatus)
    ? (normalized as PlantingStatus)
    : null;
};

const getStatusChangedSubtitle = (payload?: Record<string, unknown>) => {
  if (!payload) return undefined;

  const nextStatus =
    parsePlantingStatus(payload.toStatus) ??
    parsePlantingStatus(payload.newStatus) ??
    parsePlantingStatus(payload.status) ??
    parsePlantingStatus(payload.nextStatus) ??
    parsePlantingStatus(payload.to);

  if (!nextStatus) return undefined;
  return `Nowy status: ${getPlantingStatusLabel(nextStatus)}`;
};

export const getTimelineItemPresentation = (
  item: TimelineItem,
): TimelineItemPresentation => {
  switch (item.type) {
    case "PLANTING_EVENT":
      return {
        icon: getPlantingEventTypeIcon(item.eventType),
        title: mapPlantingEventTypeToLabel(item.eventType),
        subtitle:
          item.eventType === "PLANTING_STATUS_CHANGED"
            ? getStatusChangedSubtitle(item.payload)
            : undefined,
      };
    case "ACTION_COMPLETED": {
      const subtitle = item.actionType
        ? mapActionTypeToLabel(item.actionType)
        : undefined;
      return {
        icon: getActionTypeIcon(item.actionType),
        title: item.title,
        subtitle,
      };
    }
    case "PEST_OCCURRENCE":
      return {
        icon: "bug-outline",
        iconColor: "warning",
        title: `Szkodnik: ${item.pestName}`,
        subtitle: mapOccurrenceStatusToLabel(item.status),
      };
    case "DISEASE_OCCURRENCE": {
      const parts = [
        mapOccurrenceStatusToLabel(item.status),
        item.severity ? mapDiseaseSeverityToLabel(item.severity) : null,
      ].filter(Boolean);
      return {
        icon: "alert-circle-outline",
        iconColor: "danger",
        title: `Choroba: ${item.diseaseName}`,
        subtitle: parts.join(" • "),
      };
    }
    default:
      return { icon: "calendar-outline", title: "Zdarzenie" };
  }
};
