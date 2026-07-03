import { PremiumPaywallReason } from "@/src/api/queries/entitlements/types";
import { usePremium } from "@/src/context/PremiumContext";
import { StyleProp, ViewStyle } from "react-native";
import { Button } from "react-native-paper";

type Props = {
  label?: string;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  reason?: PremiumPaywallReason;
};

export function PremiumUnlockButton({
  label = "Odblokuj Premium",
  compact = true,
  style,
  reason = "featureLocked",
}: Props) {
  const { openPremiumPaywall } = usePremium();
  return (
    <Button
      mode="contained"
      compact={compact}
      icon="crown"
      style={style}
      onPress={() => openPremiumPaywall({ reason })}
    >
      {label}
    </Button>
  );
}
