export const TUTORIAL_VERSIONS = {
  home: 1,
  beds: 1,
  bedDetails: 1,
  addPlanting: 1,
  calendar: 1,
  articles: 1,
  profile: 1,
  notifications: 1,
} as const;

export type TutorialKey = keyof typeof TUTORIAL_VERSIONS;
