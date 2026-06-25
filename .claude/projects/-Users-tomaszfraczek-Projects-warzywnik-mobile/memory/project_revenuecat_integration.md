---
name: project-revenuecat-integration
description: RevenueCat SDK integration — where things live, how purchases flow, what still needs the API key
metadata:
  type: project
---

RevenueCat integration for Android in-app purchases is implemented (2026-06-25). iOS key placeholder is ready but not wired up yet.

**Why:** Connect real Google Play billing to existing Premium paywall; backend remains source of truth.

**How to apply:** When touching payments, subscriptions, or the paywall, check these files first before assuming there's no implementation.

## Key files

| Purpose | Path |
|---------|------|
| RevenueCat constants (entitlement/offering/package IDs) | `src/services/revenueCat/revenueCat.constants.ts` |
| RevenueCat service (configure, purchase, restore, helpers) | `src/services/revenueCat/revenueCatService.ts` |
| Query keys | `src/api/queries/revenueCat/revenueCatKeys.ts` |
| POST /revenuecat/sync mutation (invalidates entitlements, beds, plantings, notes) | `src/api/queries/revenueCat/useSyncRevenueCatSubscription.ts` |
| Offerings React Query hook (Android + signed-in only) | `src/api/queries/revenueCat/useRevenueCatOffering.ts` |
| Paywall modal + purchase/restore flow | `src/context/PremiumContext.tsx` |

## Bootstrap flow

`_layout.tsx` → `AuthBootstrapGate` → `getMe()` → if `me.id` → `configureRevenueCat(me.id)`

On sign-out: `logOutRevenueCat()` is called to reset the SDK user.

`appUserID` in RevenueCat = `me.id` (backend user id, NOT Clerk ID).

## Env variable

`EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` in `.env` — currently empty, must be filled with Android Public SDK Key from RevenueCat dashboard before any build.

iOS placeholder: `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` (commented out).

## Purchase flow

1. Paywall opens → `useRevenueCatOffering` fetches default offering
2. `getPremiumPackages(offering)` → `$rc_monthly` / `$rc_annual` packages
3. User taps buy → `purchaseRevenueCatPackage(pkg)` → `CustomerInfo`
4. `hasRevenueCatPremium(customerInfo)` check → `POST /revenuecat/sync`
5. Sync `onSuccess` invalidates: `['users','me','entitlements']`, `['beds']`, `['plantings']`, `['quick-actions']`
6. Close paywall → Alert "Premium zostało aktywowane."

Restore purchase: same sync flow, shows "Zakup został przywrócony." or "Nie znaleziono aktywnej subskrypcji Premium."

## Build requirement

Purchases only work in EAS/dev build, not Expo Go. After filling the API key: `eas build -p android --profile production`.
