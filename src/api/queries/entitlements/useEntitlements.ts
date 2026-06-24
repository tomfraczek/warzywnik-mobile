import { restClient } from "@/src/api/axios";
import { useQuery } from "@tanstack/react-query";
import { entitlementKeys } from "./entitlementKeys";
import { EntitlementsDto } from "./types";

const getEntitlements = async (): Promise<EntitlementsDto> => {
  const { data } = await restClient.get<EntitlementsDto>('/users/me/entitlements');
  return data;
};

export const useEntitlements = (enabled = true) =>
  useQuery({
    queryKey: entitlementKeys.me,
    queryFn: getEntitlements,
    enabled,
  });
