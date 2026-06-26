import { setPremiumErrorHandler } from "@/src/api/axios";
import { entitlementKeys } from "@/src/api/queries/entitlements/entitlementKeys";
import {
  EntitlementsDto,
  PremiumPaywallReason,
} from "@/src/api/queries/entitlements/types";
import { useEntitlements } from "@/src/api/queries/entitlements/useEntitlements";
import { useRevenueCatOffering } from "@/src/api/queries/revenueCat/useRevenueCatOffering";
import { useSyncRevenueCatSubscription } from "@/src/api/queries/revenueCat/useSyncRevenueCatSubscription";
import {
  getPremiumPackages,
  hasRevenueCatPremium,
  isRevenueCatUserCancellation,
  purchaseRevenueCatPackage,
  restoreRevenueCatPurchases,
} from "@/src/services/revenueCat/revenueCatService";
import { useAuth } from "@clerk/clerk-expo";
import { PurchasesPackage } from "react-native-purchases";
import { useQueryClient } from "@tanstack/react-query";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Alert, Platform, ScrollView, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Icon,
  MD3Theme,
  Modal,
  Portal,
  Text,
  useTheme,
} from "react-native-paper";

// ─── reason-specific copy ────────────────────────────────────────────────────

const REASON_MESSAGES: Record<PremiumPaywallReason, string> = {
  bedsLimit: "Plan Free pozwala korzystać z 1 grządki.",
  plantingsLimit: "Plan Free pozwala mieć 5 aktywnych upraw.",
  notesLimit: "Plan Free pozwala dodać 5 notatek.",
  lockedBed: "Ta grządka jest zablokowana w planie Free.",
  lockedPlanting: "Ta uprawa jest zablokowana w planie Free.",
  lockedNote: "Ta notatka jest zablokowana w planie Free.",
  fullArticles: "Pełne artykuły są dostępne w Premium.",
  gardenPlanner: "Planowanie grządki jest dostępne w Premium.",
  seasonStatistics: "Statystyki sezonowe są dostępne w Premium.",
  cropDiseaseHistory: "Historia chorób jest dostępna w Premium.",
  cropPestHistory: "Historia szkodników jest dostępna w Premium.",
  advancedNotifications: "Zaawansowane powiadomienia są dostępne w Premium.",
  postHarvestSuggestions: "Sugestie po zbiorach są dostępne w Premium.",
  weatherBasedTasks: "Zadania pogodowe są dostępne w Premium.",
  growthStageTasks: "Zadania z etapu wzrostu są dostępne w Premium.",
  premiumRequired: "Ta funkcja jest dostępna w planie Premium.",
};

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

// ─── paywall modal content ───────────────────────────────────────────────────

type BenefitItem = { icon: string; label: string };

const BENEFITS: BenefitItem[] = [
  { icon: "sprout-outline", label: "Nielimitowane grządki" },
  { icon: "leaf", label: "Nielimitowane uprawy" },
  { icon: "note-text-outline", label: "Nielimitowane notatki" },
  { icon: "book-open-variant", label: "Pełna biblioteka wiedzy" },
  { icon: "text-long", label: "Pełne artykuły" },
  { icon: "floor-plan", label: "Planowanie grządki" },
  { icon: "chart-bar", label: "Statystyki sezonowe" },
  { icon: "bug-outline", label: "Historia chorób i szkodników" },
  { icon: "bell-ring-outline", label: "Zaawansowane powiadomienia" },
];

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));

function PaywallContent({
  reason,
  entitlements,
  onClose,
  monthlyPackage,
  annualPackage,
  isOfferingLoading,
}: {
  reason: PremiumPaywallReason;
  entitlements: EntitlementsDto | undefined;
  onClose: () => void;
  monthlyPackage: PurchasesPackage | null;
  annualPackage: PurchasesPackage | null;
  isOfferingLoading: boolean;
}) {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const { mutateAsync: syncSubscription } = useSyncRevenueCatSubscription();

  const [isActionLoading, setIsActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "error" | "info";
    text: string;
  } | null>(null);

  const isAndroid = Platform.OS === "android";
  const isTrialActive =
    entitlements?.source === "trial" && entitlements?.isPremium;
  const isTrialEnded =
    entitlements?.source === "trial" && !entitlements?.isPremium;

  const headerSubtitle = isTrialActive
    ? "Korzystasz z Premium za darmo."
    : isTrialEnded
      ? "Twój okres próbny zakończył się. Odblokuj Premium, aby kontynuować."
      : "Odblokuj pełny potencjał swojego ogrodu z planem Premium.";

  const reasonMessage = REASON_MESSAGES[reason];
  const showReasonMessage = reason !== "premiumRequired" && !isTrialActive;

  const hasAnyPackage = !!monthlyPackage || !!annualPackage;

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setIsActionLoading(true);
    setStatusMessage(null);
    try {
      const customerInfo = await purchaseRevenueCatPackage(pkg);
      if (hasRevenueCatPremium(customerInfo)) {
        try {
          await syncSubscription();
        } catch {
          setStatusMessage({
            type: "error",
            text: 'Zakup został zakończony, ale nie udało się odświeżyć statusu Premium. Spróbuj ponownie za chwilę lub użyj „Przywróć zakup".',
          });
          setIsActionLoading(false);
          return;
        }
      }
      setIsActionLoading(false);
      onClose();
      Alert.alert("Premium aktywowane", "Premium zostało aktywowane.");
    } catch (e) {
      setIsActionLoading(false);
      if (isRevenueCatUserCancellation(e)) {
        return;
      }
      setStatusMessage({
        type: "error",
        text: "Nie udało się rozpocząć płatności. Spróbuj ponownie później.",
      });
    }
  };

  const handleRestore = async () => {
    setIsActionLoading(true);
    setStatusMessage(null);
    try {
      const customerInfo = await restoreRevenueCatPurchases();
      if (hasRevenueCatPremium(customerInfo)) {
        try {
          await syncSubscription();
        } catch {
          setStatusMessage({
            type: "error",
            text: 'Zakup został zakończony, ale nie udało się odświeżyć statusu Premium. Spróbuj ponownie za chwilę lub użyj „Przywróć zakup".',
          });
          setIsActionLoading(false);
          return;
        }
        setIsActionLoading(false);
        onClose();
        Alert.alert("Zakup przywrócony", "Zakup został przywrócony.");
      } else {
        setIsActionLoading(false);
        setStatusMessage({
          type: "info",
          text: "Nie znaleziono aktywnej subskrypcji Premium.",
        });
      }
    } catch {
      setIsActionLoading(false);
      setStatusMessage({
        type: "error",
        text: "Nie udało się przywrócić zakupów. Spróbuj ponownie później.",
      });
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* header */}
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Icon source="crown" size={32} color={theme.colors.primary} />
        </View>
        <Text style={styles.title}>Premium</Text>
        <Text style={styles.subtitle}>{headerSubtitle}</Text>
      </View>

      {/* trial active info */}
      {isTrialActive ? (
        <View style={styles.trialBanner}>
          <Icon source="clock-outline" size={16} color={theme.colors.primary} />
          <Text style={styles.trialText}>
            {"Korzystasz z Premium za darmo."}
            {entitlements?.trialEndsAt
              ? `\nTwój okres próbny kończy się ${formatDate(entitlements.trialEndsAt)}.`
              : null}
          </Text>
        </View>
      ) : null}

      {/* reason-specific context */}
      {showReasonMessage ? (
        <View style={styles.reasonBanner}>
          <Icon
            source="information-outline"
            size={16}
            color={theme.colors.primary}
          />
          <Text style={styles.reasonText}>{reasonMessage}</Text>
        </View>
      ) : null}

      {/* benefits */}
      <Text style={styles.sectionTitle}>Co zyskujesz z Premium?</Text>
      <View style={styles.benefitsList}>
        {BENEFITS.map((b) => (
          <View key={b.icon} style={styles.benefitRow}>
            <Icon
              source="check-circle-outline"
              size={18}
              color={theme.colors.primary}
            />
            <Text style={styles.benefitLabel}>{b.label}</Text>
          </View>
        ))}
      </View>

      {/* pricing & purchase – Android only */}
      {isAndroid ? (
        <>
          <Text style={styles.sectionTitle}>Cennik</Text>

          {isOfferingLoading ? (
            <ActivityIndicator
              style={styles.offeringLoader}
              color={theme.colors.primary}
            />
          ) : !hasAnyPackage ? (
            <View style={styles.unavailableBanner}>
              <Text style={styles.unavailableText}>
                Płatności są chwilowo niedostępne. Spróbuj ponownie później.
              </Text>
            </View>
          ) : (
            <>
              {/* monthly card */}
              {monthlyPackage ? (
                <View style={styles.pricingCard}>
                  <View style={styles.pricingRow}>
                    <View>
                      <Text style={styles.pricingLabel}>Miesięczny</Text>
                      <Text style={styles.pricingPrice}>
                        {monthlyPackage.product.priceString} / miesiąc
                      </Text>
                    </View>
                  </View>
                </View>
              ) : null}

              {/* annual card */}
              {annualPackage ? (
                <View
                  style={[styles.pricingCard, styles.pricingCardFeatured]}
                >
                  <View style={styles.pricingRow}>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.pricingLabel,
                          { color: theme.colors.primary },
                        ]}
                      >
                        Roczny
                      </Text>
                      <Text
                        style={[
                          styles.pricingPrice,
                          { color: theme.colors.primary },
                        ]}
                      >
                        {annualPackage.product.priceString} / rok
                      </Text>
                    </View>
                    <View style={styles.saveBadge}>
                      <Text style={styles.saveBadgeText}>Najlepsza cena</Text>
                    </View>
                  </View>
                </View>
              ) : null}

              {/* status message */}
              {statusMessage ? (
                <View
                  style={[
                    styles.statusBanner,
                    statusMessage.type === "error"
                      ? styles.statusBannerError
                      : styles.statusBannerInfo,
                  ]}
                >
                  <Text style={styles.statusText}>{statusMessage.text}</Text>
                </View>
              ) : null}

              {/* purchase buttons */}
              {monthlyPackage ? (
                <Button
                  mode="outlined"
                  style={styles.purchaseButton}
                  contentStyle={styles.purchaseButtonContent}
                  disabled={isActionLoading}
                  loading={isActionLoading}
                  onPress={() => void handlePurchase(monthlyPackage)}
                >
                  Kup plan miesięczny
                </Button>
              ) : null}
              {annualPackage ? (
                <Button
                  mode="contained"
                  style={styles.purchaseButton}
                  contentStyle={styles.purchaseButtonContent}
                  disabled={isActionLoading}
                  loading={isActionLoading}
                  onPress={() => void handlePurchase(annualPackage)}
                >
                  Kup plan roczny
                </Button>
              ) : null}

              {/* restore purchase */}
              <Button
                mode="text"
                style={styles.restoreButton}
                disabled={isActionLoading}
                onPress={() => void handleRestore()}
              >
                Przywróć zakup
              </Button>
            </>
          )}
        </>
      ) : null}

      {/* dismiss */}
      <Button mode="text" onPress={onClose} style={styles.laterButton}>
        Może później
      </Button>
    </ScrollView>
  );
}

function makeStyles(theme: MD3Theme) {
  return StyleSheet.create({
    scroll: {
      maxHeight: "90%",
    },
    scrollContent: {
      padding: 24,
      paddingBottom: 32,
    },
    header: {
      alignItems: "center",
      marginBottom: 20,
    },
    iconWrap: {
      width: 64,
      height: 64,
      borderRadius: 20,
      backgroundColor: theme.colors.primaryContainer,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: theme.colors.onSurface,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 14,
      lineHeight: 20,
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
    },
    trialBanner: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      backgroundColor: theme.colors.primaryContainer,
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
    },
    trialText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 18,
      color: theme.colors.onPrimaryContainer,
    },
    reasonBanner: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      backgroundColor: theme.colors.primaryContainer,
      borderRadius: 12,
      padding: 12,
      marginBottom: 20,
    },
    reasonText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 18,
      color: theme.colors.onPrimaryContainer,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.colors.onSurfaceVariant,
      marginBottom: 10,
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    benefitsList: {
      gap: 10,
      marginBottom: 24,
    },
    benefitRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    benefitLabel: {
      fontSize: 14,
      color: theme.colors.onSurface,
    },
    offeringLoader: {
      marginVertical: 20,
    },
    unavailableBanner: {
      borderRadius: 12,
      padding: 14,
      backgroundColor: theme.colors.surfaceVariant,
      marginBottom: 16,
    },
    unavailableText: {
      fontSize: 13,
      lineHeight: 18,
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
    },
    pricingCard: {
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
    },
    pricingCardFeatured: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryContainer,
      marginBottom: 16,
    },
    pricingRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    pricingLabel: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 2,
    },
    pricingPrice: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    saveBadge: {
      backgroundColor: theme.colors.primary,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    saveBadgeText: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.colors.onPrimary,
    },
    statusBanner: {
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
    },
    statusBannerError: {
      backgroundColor: theme.colors.errorContainer,
    },
    statusBannerInfo: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    statusText: {
      fontSize: 13,
      lineHeight: 18,
      color: theme.colors.onSurface,
    },
    purchaseButton: {
      borderRadius: 14,
      marginBottom: 8,
    },
    purchaseButtonContent: {
      paddingVertical: 6,
    },
    restoreButton: {
      alignSelf: "center",
      marginBottom: 4,
    },
    laterButton: {
      alignSelf: "center",
      marginTop: 4,
    },
  });
}

// ─── context ─────────────────────────────────────────────────────────────────

type PremiumContextValue = {
  openPremiumPaywall: (args: { reason: PremiumPaywallReason }) => void;
  entitlements: EntitlementsDto | undefined;
  isEntitlementsLoading: boolean;
};

const PremiumContext = createContext<PremiumContextValue>({
  openPremiumPaywall: () => {},
  entitlements: undefined,
  isEntitlementsLoading: false,
});

function PaywallModal({
  visible,
  reason,
  entitlements,
  onClose,
  monthlyPackage,
  annualPackage,
  isOfferingLoading,
}: {
  visible: boolean;
  reason: PremiumPaywallReason;
  entitlements: EntitlementsDto | undefined;
  onClose: () => void;
  monthlyPackage: PurchasesPackage | null;
  annualPackage: PurchasesPackage | null;
  isOfferingLoading: boolean;
}) {
  const theme = useTheme<MD3Theme>();
  const modalContainerStyle = {
    margin: 16,
    borderRadius: 20,
    overflow: "hidden" as const,
    backgroundColor: theme.colors.surface,
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={modalContainerStyle}
      >
        <PaywallContent
          reason={reason}
          entitlements={entitlements}
          onClose={onClose}
          monthlyPackage={monthlyPackage}
          annualPackage={annualPackage}
          isOfferingLoading={isOfferingLoading}
        />
      </Modal>
    </Portal>
  );
}

export function PremiumProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const { data: entitlements, isLoading } = useEntitlements(
    isSignedIn === true,
  );

  const { data: offering, isLoading: isOfferingLoading } =
    useRevenueCatOffering();
  const { monthlyPackage, annualPackage } = getPremiumPackages(
    offering ?? null,
  );

  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<PremiumPaywallReason>("premiumRequired");

  const openPremiumPaywall = useCallback(
    (args: { reason: PremiumPaywallReason }) => {
      setReason(args.reason);
      setIsOpen(true);
    },
    [],
  );

  useEffect(() => {
    setPremiumErrorHandler((errorData) => {
      openPremiumPaywall({ reason: mapPremiumErrorToReason(errorData) });
    });
    return () => {
      setPremiumErrorHandler(null);
    };
  }, [openPremiumPaywall]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    void queryClient.invalidateQueries({ queryKey: entitlementKeys.me });
  }, [queryClient]);

  return (
    <PremiumContext.Provider
      value={{ openPremiumPaywall, entitlements, isEntitlementsLoading: isLoading }}
    >
      {children}
      <PaywallModal
        visible={isOpen}
        reason={reason}
        entitlements={entitlements}
        onClose={handleClose}
        monthlyPackage={monthlyPackage}
        annualPackage={annualPackage}
        isOfferingLoading={isOfferingLoading}
      />
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  return useContext(PremiumContext);
}
