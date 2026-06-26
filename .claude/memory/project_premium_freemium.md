---
name: project-premium-freemium
description: Free/Premium subscription model — Entitlements API, paywall modal, soft lock for beds/plantings/notes, PremiumContext, axios 403 handler, trial modal
metadata:
  type: project
---

Backend model: `GET /v1/users/me/entitlements` → `EntitlementsDto` with `plan`, `source` (trial/subscription/free), `isPremium`, `trialStartedAt`, `trialEndsAt`, `subscriptionExpiresAt`, `limits`, `features`.

RevenueCat entitlement: `premium`, offering: `default`, packages: `$rc_monthly`, `$rc_annual`.

**Paywall flow:** RevenueCat purchase → `POST /v1/revenuecat/sync` → `GET /v1/users/me/entitlements` → backend entitlements unlock Premium. Never set isPremium locally without backend confirmation.

**PremiumContext** (`src/context/PremiumContext.tsx`): manages paywall modal, fetches RevenueCat offering, exposes `openPremiumPaywall` and `entitlements`. 403 errors with `code: "PREMIUM_REQUIRED"` auto-open paywall via axios interceptor.

**Trial is backend-only**: 7-day free trial, no card required. Frontend reads `source === 'trial'` and `trialEndsAt` — never stores trial state itself.

**Trial welcome modal** (`src/components/TrialWelcomeModal.tsx`): shown once per user/device via AsyncStorage key `seen_trial_welcome_modal_v1:{userId}`. Shows before HomeScreen tutorial.

**Home onboarding queue**: trial modal → tutorial. Controlled by `onboardingReady` flag + `trialModalCheckedRef` in `HomeScreen`.

**Profile**: "Dostęp próbny Premium" card (when trial active) with 7-day description, end date, days remaining. Subscription card shows "Premium trial aktywny"/"Premium aktywne"/"Plan Free" + dates.

**Why:** Backend is source of truth. Trial is a backend construct, not Google Play trial.
