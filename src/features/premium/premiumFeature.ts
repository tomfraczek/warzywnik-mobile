import {
  EntitlementsDto,
  PremiumFeature,
} from "@/src/api/queries/entitlements/types";

export function hasPremiumFeature(
  entitlements: EntitlementsDto | undefined,
  feature: PremiumFeature,
): boolean {
  return Boolean(entitlements?.features[feature]);
}
