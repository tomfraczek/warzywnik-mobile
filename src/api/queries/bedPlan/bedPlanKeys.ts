export const bedPlanKeys = {
  all: ["bed-plan"] as const,
  byBed: (bedId: string) => ["bed-plan", "bed", bedId] as const,
};
