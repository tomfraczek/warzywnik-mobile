import { setPremiumErrorHandler } from "@/src/api/axios";
import {
  EntitlementsDto,
  PremiumPaywallReason,
} from "@/src/api/queries/entitlements/types";
import { useEntitlements } from "@/src/api/queries/entitlements/useEntitlements";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// ─── 403 error → paywall reason mapper ──────────────────────────────────────

function mapPremiumErrorToReason(errorData: unknown): PremiumPaywallReason {
  if (!errorData || typeof errorData !== "object") return "premiumRequired";
  const data = errorData as Record<string, unknown>;
  const details = data.details as Record<string, unknown> | undefined;
  if (!details) return "premiumRequired";

  const reason = details.reason as string | undefined;

  if (reason === "LIMIT_REACHED") {
    const limitType = details.limitType as string | undefined;
    if (limitType === "beds") return "bedsLimit";
    if (limitType === "activePlantings") return "plantingsLimit";
    if (limitType === "notes") return "notesLimit";
    return "premiumRequired";
  }

  if (reason === "RESOURCE_LOCKED") {
    const resourceType = details.resourceType as string | undefined;
    if (resourceType === "bed") return "lockedBed";
    if (resourceType === "planting") return "lockedPlanting";
    if (resourceType === "note") return "lockedNote";
    return "premiumRequired";
  }

  if (reason === "FEATURE_LOCKED") {
    const feature = details.feature as string | undefined;
    const featureMap: Record<string, PremiumPaywallReason> = {
      fullArticles: "fullArticles",
      gardenPlanner: "gardenPlanner",
      seasonStatistics: "seasonStatistics",
      cropDiseaseHistory: "cropDiseaseHistory",
      cropPestHistory: "cropPestHistory",
      advancedNotifications: "advancedNotifications",
      postHarvestSuggestions: "postHarvestSuggestions",
      weatherBasedTasks: "weatherBasedTasks",
      growthStageTasks: "growthStageTasks",
    };
    if (feature && feature in featureMap) return featureMap[feature];
    return "premiumRequired";
  }

  return "premiumRequired";
}

// ─── context ─────────────────────────────────────────────────────────────────

type PremiumContextValue = {
  openPremiumPaywall: (args: { reason: PremiumPaywallReason }) => void;
  entitlements: EntitlementsDto | undefined;
  isEntitlementsLoading: boolean;
  trialCheckDone: boolean;
  setTrialCheckDone: () => void;
  trialModalShowing: boolean;
  setTrialModalShowing: (showing: boolean) => void;
};

const PremiumContext = createContext<PremiumContextValue>({
  openPremiumPaywall: () => {},
  entitlements: undefined,
  isEntitlementsLoading: false,
  trialCheckDone: true,
  setTrialCheckDone: () => {},
  trialModalShowing: false,
  setTrialModalShowing: () => {},
});

export function PremiumProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const { data: entitlements, isLoading } = useEntitlements(
    isSignedIn === true,
  );

  const [trialCheckDone, setTrialCheckDone_] = useState(false);
  const [trialModalShowing, setTrialModalShowing_] = useState(false);

  // Reset gate on sign-out so the next sign-in re-evaluates
  useEffect(() => {
    if (!isSignedIn) {
      setTrialCheckDone_(false);
      setTrialModalShowing_(false);
    }
  }, [isSignedIn]);

  // Non-trial users don't need the trial modal → open gate immediately
  useEffect(() => {
    if (!entitlements || trialCheckDone) return;
    const isTrialActive =
      entitlements.source === "trial" && entitlements.isPremium;
    if (!isTrialActive) setTrialCheckDone_(true);
  }, [entitlements, trialCheckDone]);

  const setTrialCheckDone = useCallback(() => setTrialCheckDone_(true), []);
  const setTrialModalShowing = useCallback(
    (showing: boolean) => setTrialModalShowing_(showing),
    [],
  );

  const isNavigatingRef = useRef(false);

  const openPremiumPaywall = useCallback(
    (args: { reason: PremiumPaywallReason }) => {
      if (isNavigatingRef.current) return;
      isNavigatingRef.current = true;
      void router.push({
        pathname: "/premium",
        params: { reason: args.reason },
      });
      // Release guard after navigation settles so future calls work
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 1500);
    },
    [router],
  );

  useEffect(() => {
    setPremiumErrorHandler((errorData) => {
      openPremiumPaywall({ reason: mapPremiumErrorToReason(errorData) });
    });
    return () => {
      setPremiumErrorHandler(null);
    };
  }, [openPremiumPaywall]);

  return (
    <PremiumContext.Provider
      value={{
        openPremiumPaywall,
        entitlements,
        isEntitlementsLoading: isLoading,
        trialCheckDone,
        setTrialCheckDone,
        trialModalShowing,
        setTrialModalShowing,
      }}
    >
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  return useContext(PremiumContext);
}
