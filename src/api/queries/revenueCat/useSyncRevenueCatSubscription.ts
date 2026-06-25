import { restClient } from '@/src/api/axios';
import { bedKeys } from '@/src/api/queries/beds/bedKeys';
import { entitlementKeys } from '@/src/api/queries/entitlements/entitlementKeys';
import { plantingKeys } from '@/src/api/queries/plantings/plantingKeys';
import { quickActionKeys } from '@/src/api/queries/quickActions/quickActionKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { revenueCatKeys } from './revenueCatKeys';

const syncRevenueCatSubscription = async () => {
  const { data } = await restClient.post('/revenuecat/sync');
  return data;
};

export const useSyncRevenueCatSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: revenueCatKeys.sync,
    mutationFn: syncRevenueCatSubscription,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: entitlementKeys.me });
      void queryClient.invalidateQueries({ queryKey: bedKeys.all });
      void queryClient.invalidateQueries({ queryKey: plantingKeys.all });
      void queryClient.invalidateQueries({ queryKey: quickActionKeys.all });
    },
  });
};
