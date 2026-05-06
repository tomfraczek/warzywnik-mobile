import { TaskItem } from "@/src/api/queries/users/meTypes";

export const plantingLevelTaskMock: TaskItem = {
  id: "task-planting-1",
  title: "Podlej sadzonki",
  status: "pending",
  targetType: "PLANTING",
  plantingId: "planting-1",
  bedId: "bed-1",
  dueAt: "2026-05-05T08:00:00.000Z",
};

export const bedLevelTaskWithVegetablesMock: TaskItem = {
  id: "task-bed-1",
  title: "Kontrola wilgotności gleby",
  status: "pending",
  targetType: "BED",
  bedId: "bed-1",
  plantingId: null,
  metadata: {
    aggregationScope: "bed",
    affectedPlantingIds: ["planting-1", "planting-2"],
    affectedVegetables: ["Kapusta biała", "Arbuz klasyczny"],
    originPlantingTaskCount: 2,
  },
};

export const bedLevelTaskWithoutVegetablesMock: TaskItem = {
  id: "task-bed-2",
  title: "Inspekcja grządki",
  status: "pending",
  targetType: "BED",
  bedId: "bed-1",
  plantingId: null,
  metadata: {
    aggregationScope: "bed",
    affectedPlantingIds: ["planting-3"],
    originPlantingTaskCount: 1,
  },
};

export const bedLevelTaskWithEmptyAffectedVegetablesMock: TaskItem = {
  id: "task-bed-3",
  title: "Kontrola nawodnienia",
  status: "pending",
  targetType: "BED",
  bedId: "bed-1",
  plantingId: null,
  metadata: {
    aggregationScope: "bed",
    affectedPlantingIds: ["planting-1", "planting-2", "planting-4"],
    affectedVegetables: [],
    originPlantingTaskCount: 3,
  },
};

export const nullPlantingIdTaskMock: TaskItem = {
  id: "task-null-planting",
  title: "Zadanie bez uprawy",
  status: "pending",
  targetType: "BED",
  bedId: "bed-2",
  plantingId: null,
};

export const bedLevelNavigationExpectation = {
  taskId: bedLevelTaskWithVegetablesMock.id,
  expectedRoute: "/(tabs)/beds/bed-1",
};

export const bedLevelActionsExpectation = {
  taskId: bedLevelTaskWithVegetablesMock.id,
  allowedActions: ["done", "canceled", "edit", "delete", "reschedule"],
};

export const bedLevelDoneActionExpectation = {
  taskId: bedLevelTaskWithVegetablesMock.id,
  mutationPayload: { status: "done" },
  expectedStatusAfterAction: "done",
};
