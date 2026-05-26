import {
  OwnershipTaskLike,
  getTaskBadgeContext,
  getTaskPresentationType,
  getTaskRelationType,
} from "./taskOwnership";

export const getTaskOwnershipLabel = (task: OwnershipTaskLike) => {
  const presentation = getTaskPresentationType(task);
  if (presentation === "direct_planting") return "Zadanie uprawy";
  if (presentation === "bed") return "Zadanie grządki";
  if (presentation === "space") return "Zadanie szklarni/przestrzeni";
  if (presentation === "related_from_bed") {
    return "Dotyczy tej uprawy przez grządkę";
  }
  if (presentation === "related_from_space") {
    return "Dotyczy tej uprawy przez przestrzeń";
  }
  return "Zadanie ogrodowe";
};

export const getTaskOwnershipReason = (task: OwnershipTaskLike) => {
  const relation = getTaskRelationType(task);
  const badgeContext = getTaskBadgeContext(task);

  if (relation === "related_from_bed") {
    return "Widzisz zadanie, bo dotyczy Twojej uprawy przez kontekst grządki.";
  }

  if (relation === "related_from_space") {
    return "Widzisz zadanie, bo dotyczy Twojej uprawy przez kontekst przestrzeni.";
  }

  if (badgeContext === "bed") return "Zadanie przypisane do grządki.";
  if (badgeContext === "space") return "Zadanie przypisane do przestrzeni.";
  if (badgeContext === "planting")
    return "Zadanie przypisane bezpośrednio do uprawy.";

  return "Zadanie globalne użytkownika.";
};
