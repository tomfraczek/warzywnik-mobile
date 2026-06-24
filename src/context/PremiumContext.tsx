import { setPremiumErrorHandler } from "@/src/api/axios";
import { entitlementKeys } from "@/src/api/queries/entitlements/entitlementKeys";
import {
  EntitlementsDto,
  PremiumPaywallReason,
} from "@/src/api/queries/entitlements/types";
import { useEntitlements } from "@/src/api/queries/entitlements/useEntitlements";
import { useAuth } from "@clerk/clerk-expo";
import { useQueryClient } from "@tanstack/react-query";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import {
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
}: {
  reason: PremiumPaywallReason;
  entitlements: EntitlementsDto | undefined;
  onClose: () => void;
}) {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);

  const isTrialEnded =
    entitlements?.source === "trial" && !entitlements?.isPremium;

  const headerSubtitle = isTrialEnded
    ? "Twój okres próbny zakończył się. Odblokuj Premium, aby kontynuować."
    : "Odblokuj pełny potencjał swojego ogrodu z planem Premium.";

  const reasonMessage = REASON_MESSAGES[reason];
  const showReasonMessage = reason !== "premiumRequired";

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

      {/* reason-specific context */}
      {showReasonMessage ? (
        <View style={styles.reasonBanner}>
          <Icon source="information-outline" size={16} color={theme.colors.primary} />
          <Text style={styles.reasonText}>{reasonMessage}</Text>
        </View>
      ) : null}

      {/* benefits */}
      <Text style={styles.sectionTitle}>Co zyskujesz z Premium?</Text>
      <View style={styles.benefitsList}>
        {BENEFITS.map((b) => (
          <View key={b.icon} style={styles.benefitRow}>
            <Icon source="check-circle-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.benefitLabel}>{b.label}</Text>
          </View>
        ))}
      </View>

      {/* pricing */}
      <Text style={styles.sectionTitle}>Cennik</Text>
      <View style={styles.pricingCard}>
        <View style={styles.pricingRow}>
          <View>
            <Text style={styles.pricingLabel}>Miesięczny</Text>
            <Text style={styles.pricingPrice}>9,99 zł / miesiąc</Text>
          </View>
        </View>
      </View>
      <View style={[styles.pricingCard, styles.pricingCardFeatured]}>
        <View style={styles.pricingRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.pricingLabel, { color: theme.colors.primary }]}>
              Roczny
            </Text>
            <Text style={[styles.pricingPrice, { color: theme.colors.primary }]}>
              59,99 zł / rok
            </Text>
          </View>
          <View style={styles.saveBadge}>
            <Text style={styles.saveBadgeText}>Najlepsza oferta</Text>
          </View>
        </View>
      </View>

      {/* CTA buttons */}
      <Button
        mode="contained"
        style={styles.ctaButton}
        contentStyle={styles.ctaButtonContent}
        onPress={() => {
          Alert.alert(
            "Płatności wkrótce",
            "Płatności zostaną dodane w kolejnym kroku.",
          );
        }}
      >
        Odblokuj Premium
      </Button>
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
      marginBottom: 24,
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
    ctaButton: {
      borderRadius: 14,
      marginBottom: 8,
    },
    ctaButtonContent: {
      paddingVertical: 6,
    },
    laterButton: {
      alignSelf: "center",
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
}: {
  visible: boolean;
  reason: PremiumPaywallReason;
  entitlements: EntitlementsDto | undefined;
  onClose: () => void;
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
      />
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  return useContext(PremiumContext);
}
