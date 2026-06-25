import { REVENUECAT_OFFERING_DEFAULT } from '@/src/services/revenueCat/revenueCat.constants';

export const revenueCatKeys = {
  sync: ['revenueCat', 'sync'] as const,
  offerings: (name: string) => ['revenueCat', 'offerings', name] as const,
  defaultOffering: ['revenueCat', 'offerings', REVENUECAT_OFFERING_DEFAULT] as const,
};
