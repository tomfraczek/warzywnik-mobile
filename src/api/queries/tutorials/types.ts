export type TutorialEntry = {
  completed: boolean;
  version: number;
  completedAt: string | null;
};

export type TutorialsDto = {
  enabled: boolean;
  tutorials: Record<string, TutorialEntry>;
};
