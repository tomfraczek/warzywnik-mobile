import { entitlementKeys } from "@/src/api/queries/entitlements/entitlementKeys";
import { useRevenueCatOffering } from "@/src/api/queries/revenueCat/useRevenueCatOffering";
import { useSyncRevenueCatSubscription } from "@/src/api/queries/revenueCat/useSyncRevenueCatSubscription";
import { Screen } from "@/src/components/Screen";
import CustomHeader from "@/src/components/navigation/CustomHeader";
import {
  getPremiumPackages,
  hasRevenueCatPremium,
  isRevenueCatUserCancellation,
  purchaseRevenueCatPackage,
} from "@/src/services/revenueCat/revenueCatService";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Icon,
  MD3Theme,
  Text,
  useTheme,
} from "react-native-paper";
import { PurchasesPackage } from "react-native-purchases";

const BENEFITS = [
  { label: "Nielimitowane grządki" },
  { label: "Nielimitowane uprawy" },
  { label: "Nielimitowane notatki" },
  { label: "Pełna biblioteka wiedzy" },
  { label: "Pełne artykuły" },
  { label: "Planowanie grządki" },
  { label: "Statystyki sezonowe" },
  { label: "Historia chorób i szkodników" },
  { label: "Zaawansowane powiadomienia" },
];

function formatMonthlyEquiv(price: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price / 12);
  } catch {
    return `${(price / 12).toFixed(2)} ${currencyCode}`;
  }
}

export default function PremiumScreen() {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  const showFeatureLockedNotice = !!reason && reason !== "premiumRequired";
  const { data: offering, isLoading: isOfferingLoading } =
    useRevenueCatOffering();
  const { mutateAsync: syncSubscription } = useSyncRevenueCatSubscription();
  const { monthlyPackage, annualPackage } = getPremiumPackages(
    offering ?? null,
  );

  const [selected, setSelected] = useState<PurchasesPackage | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "error" | "info";
    text: string;
  } | null>(null);

  const isAndroid = Platform.OS === "android";

  // Default selection: annual if available, otherwise monthly
  useEffect(() => {
    if (selected) return;
    if (annualPackage) setSelected(annualPackage);
    else if (monthlyPackage) setSelected(monthlyPackage);
  }, [annualPackage, monthlyPackage, selected]);

  useEffect(() => {
    return () => {
      void queryClient.invalidateQueries({ queryKey: entitlementKeys.me });
    };
  }, [queryClient]);

  const handlePurchase = useCallback(async () => {
    if (!selected) return;
    setIsPurchasing(true);
    setStatusMessage(null);
    try {
      const customerInfo = await purchaseRevenueCatPackage(selected);
      if (hasRevenueCatPremium(customerInfo)) {
        try {
          await syncSubscription();
        } catch {
          setStatusMessage({
            type: "error",
            text: 'Zakup został zakończony, ale nie udało się odświeżyć statusu Premium. Spróbuj ponownie za chwilę lub użyj „Przywróć zakup".',
          });
          setIsPurchasing(false);
          return;
        }
      }
      setIsPurchasing(false);
      router.back();
      Alert.alert("Premium aktywowane", "Premium zostało aktywowane.");
    } catch (e) {
      setIsPurchasing(false);
      if (isRevenueCatUserCancellation(e)) return;
      setStatusMessage({
        type: "error",
        text: "Nie udało się rozpocząć płatności. Spróbuj ponownie później.",
      });
    }
  }, [router, selected, syncSubscription]);

  const hasPackages = !!monthlyPackage || !!annualPackage;

  return (
    <Screen safeAreaEdges={["left", "right", "bottom"]}>
      <CustomHeader title="Premium" showBack />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {showFeatureLockedNotice ? (
          <View style={styles.featureLockedBanner}>
            <Icon source="lock-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.featureLockedText}>
              Ta funkcja dostępna jest tylko dla konta Premium.
            </Text>
          </View>
        ) : null}

        <Text style={styles.mainTitle}>
          Odblokuj pełny potencjał swojego ogrodu z planem Premium
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Kup Warzywnik Premium</Text>

          {/* Benefits */}
          <View style={styles.benefitsList}>
            {BENEFITS.map((b) => (
              <View key={b.label} style={styles.benefitRow}>
                <Icon
                  source="check-circle-outline"
                  size={18}
                  color={theme.colors.primary}
                />
                <Text style={styles.benefitLabel}>{b.label}</Text>
              </View>
            ))}
          </View>

          {/* Plan options – Android only */}
          {isAndroid ? (
            isOfferingLoading ? (
              <ActivityIndicator
                color={theme.colors.primary}
                style={styles.loader}
              />
            ) : !hasPackages ? (
              <View style={styles.unavailableBanner}>
                <Text style={styles.unavailableText}>
                  Płatności są chwilowo niedostępne. Spróbuj ponownie później.
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.optionsList}>
                  {monthlyPackage ? (
                    <Pressable
                      onPress={() => setSelected(monthlyPackage)}
                      style={({ pressed }) => [
                        styles.option,
                        selected === monthlyPackage && styles.optionSelected,
                        pressed && styles.optionPressed,
                      ]}
                    >
                      <View style={styles.optionLeft}>
                        <Text style={styles.optionLabel}>Miesięczny</Text>
                        <Text style={styles.optionPrice}>
                          {monthlyPackage.product.priceString} / miesiąc
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.radioOuter,
                          selected === monthlyPackage &&
                            styles.radioOuterSelected,
                        ]}
                      >
                        {selected === monthlyPackage ? (
                          <View style={styles.radioInner} />
                        ) : null}
                      </View>
                    </Pressable>
                  ) : null}

                  {annualPackage ? (
                    <Pressable
                      onPress={() => setSelected(annualPackage)}
                      style={({ pressed }) => [
                        styles.option,
                        styles.optionFeatured,
                        selected === annualPackage && styles.optionSelected,
                        pressed && styles.optionPressed,
                      ]}
                    >
                      <View style={styles.optionLeft}>
                        <View style={styles.optionLabelRow}>
                          <Text
                            style={[
                              styles.optionLabel,
                              { color: theme.colors.primary },
                            ]}
                          >
                            Roczny
                          </Text>
                          <View style={styles.recommendedBadge}>
                            <Text style={styles.recommendedBadgeText}>
                              Polecane
                            </Text>
                          </View>
                        </View>
                        <Text
                          style={[
                            styles.optionPrice,
                            { color: theme.colors.primary },
                          ]}
                        >
                          {annualPackage.product.priceString} / rok
                        </Text>
                        <Text style={styles.optionMonthlyEquiv}>
                          {formatMonthlyEquiv(
                            annualPackage.product.price,
                            annualPackage.product.currencyCode,
                          )}{" "}
                          / miesiąc
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.radioOuter,
                          selected === annualPackage &&
                            styles.radioOuterSelected,
                        ]}
                      >
                        {selected === annualPackage ? (
                          <View style={styles.radioInner} />
                        ) : null}
                      </View>
                    </Pressable>
                  ) : null}
                </View>

                {statusMessage ? (
                  <View
                    style={[
                      styles.statusBanner,
                      statusMessage.type === "error"
                        ? styles.statusError
                        : styles.statusInfo,
                    ]}
                  >
                    <Text style={styles.statusText}>{statusMessage.text}</Text>
                  </View>
                ) : null}

                <Button
                  mode="contained"
                  style={styles.buyButton}
                  contentStyle={styles.buyButtonContent}
                  loading={isPurchasing}
                  disabled={isPurchasing || !selected}
                  onPress={() => void handlePurchase()}
                >
                  Kup Premium
                </Button>
              </>
            )
          ) : (
            <View style={styles.unavailableBanner}>
              <Text style={styles.unavailableText}>
                Zakupy dostępne w wersji aplikacji na urządzenia Android.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function makeStyles(theme: MD3Theme) {
  return StyleSheet.create({
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    featureLockedBanner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 16,
      marginBottom: 4,
      paddingHorizontal: 4,
    },
    featureLockedText: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.colors.primary,
      textAlign: "center",
    },
    mainTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: theme.colors.onSurface,
      textAlign: "center",
      paddingTop: 20,
      paddingBottom: 20,
      lineHeight: 30,
    },
    card: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
      padding: 24,
      paddingBottom: 28,
    },
    cardTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.colors.onSurface,
      marginBottom: 20,
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
      flex: 1,
    },
    loader: {
      marginVertical: 20,
    },
    unavailableBanner: {
      borderRadius: 12,
      padding: 14,
      backgroundColor: theme.colors.surfaceVariant,
    },
    unavailableText: {
      fontSize: 13,
      lineHeight: 18,
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
    },
    optionsList: {
      gap: 10,
      marginBottom: 20,
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: 14,
      padding: 14,
    },
    optionFeatured: {
      borderColor: theme.colors.primary,
    },
    optionSelected: {
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    optionPressed: {
      opacity: 0.75,
    },
    optionLeft: {
      flex: 1,
    },
    optionLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 2,
    },
    optionLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    optionMonthlyEquiv: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 2,
    },
    optionPrice: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    recommendedBadge: {
      backgroundColor: theme.colors.primaryContainer,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    recommendedBadgeText: {
      fontSize: 11,
      fontWeight: "600",
      color: theme.colors.primary,
    },
    radioOuter: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.colors.outlineVariant,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 12,
    },
    radioOuterSelected: {
      borderColor: theme.colors.primary,
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.primary,
    },
    statusBanner: {
      borderRadius: 12,
      padding: 12,
      marginBottom: 16,
    },
    statusError: {
      backgroundColor: theme.colors.errorContainer,
    },
    statusInfo: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    statusText: {
      fontSize: 13,
      lineHeight: 18,
      color: theme.colors.onSurface,
    },
    buyButton: {
      borderRadius: 14,
    },
    buyButtonContent: {
      paddingVertical: 6,
    },
  });
}
