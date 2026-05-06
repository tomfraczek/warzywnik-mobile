export const quickActionKeys = {
  all: ["quick-actions"] as const,
  bedNotes: (bedId: string) =>
    ["quick-actions", "bed", bedId, "notes"] as const,
  plantingNotes: (plantingId: string) =>
    ["quick-actions", "planting", plantingId, "notes"] as const,
};
