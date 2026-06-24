export type SubscriptionPlan = 'free' | 'premium';

export type EntitlementSource = 'trial' | 'subscription' | 'free';

export type PremiumFeature =
  | 'fullArticles'
  | 'gardenPlanner'
  | 'seasonStatistics'
  | 'cropDiseaseHistory'
  | 'cropPestHistory'
  | 'advancedNotifications'
  | 'postHarvestSuggestions'
  | 'weatherBasedTasks'
  | 'growthStageTasks';

export type EntitlementsDto = {
  plan: SubscriptionPlan;
  source: EntitlementSource;
  isPremium: boolean;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  subscriptionExpiresAt: string | null;
  limits: {
    beds: number | null;
    activePlantings: number | null;
    notes: number | null;
  };
  features: {
    fullArticles: boolean;
    gardenPlanner: boolean;
    seasonStatistics: boolean;
    cropDiseaseHistory: boolean;
    cropPestHistory: boolean;
    advancedNotifications: boolean;
    postHarvestSuggestions: boolean;
    weatherBasedTasks: boolean;
    growthStageTasks: boolean;
  };
};

export type AccessStatus = 'available' | 'locked';

export type PremiumPaywallReason =
  | 'bedsLimit'
  | 'plantingsLimit'
  | 'notesLimit'
  | 'lockedBed'
  | 'lockedPlanting'
  | 'lockedNote'
  | 'fullArticles'
  | 'gardenPlanner'
  | 'seasonStatistics'
  | 'cropDiseaseHistory'
  | 'cropPestHistory'
  | 'advancedNotifications'
  | 'postHarvestSuggestions'
  | 'weatherBasedTasks'
  | 'growthStageTasks'
  | 'premiumRequired';
