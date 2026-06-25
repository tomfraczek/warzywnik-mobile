import { getRevenueCatOfferings } from '@/src/services/revenueCat/revenueCatService';
import { useAuth } from '@clerk/clerk-expo';
import { useQuery } from '@tanstack/react-query';
import { Platform } from 'react-native';
import { revenueCatKeys } from './revenueCatKeys';

export const useRevenueCatOffering = () => {
  const { isSignedIn } = useAuth();
  const isAndroid = Platform.OS === 'android';

  return useQuery({
    queryKey: revenueCatKeys.defaultOffering,
    queryFn: getRevenueCatOfferings,
    enabled: isSignedIn === true && isAndroid,
  });
};
