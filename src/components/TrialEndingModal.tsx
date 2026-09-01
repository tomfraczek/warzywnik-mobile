import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";
import { View, StyleSheet } from "react-native";
import {
  Button,
  Icon,
  MD3Theme,
  Modal,
  Portal,
  Text,
  useTheme,
} from "react-native-paper";

const TRIAL_ENDING_KEY_PREFIX = "seen_trial_ending_modal_v1:";

function getTodayKey(): string {
  return dayjs().format("YYYY-MM-DD");
}

export function getTrialEndingStorageKey(userId: string): string {
  return `${TRIAL_ENDING_KEY_PREFIX}${userId}:${getTodayKey()}`;
}

/** Whether the trial-ending reminder has already been shown today for this user. */
export async function hasSeenTrialEndingModalToday(
  userId: string,
): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(
      getTrialEndingStorageKey(userId),
    );
    return value === "true";
  } catch {
    return false;
  }
}

export async function markTrialEndingModalSeenToday(
  userId: string,
): Promise<void> {
  try {
    await AsyncStorage.setItem(getTrialEndingStorageKey(userId), "true");
  } catch {
    // ignore storage failures
  }
}

/**
 * Days left until the trial ends, counted by calendar day (ignores time of
 * day, so "3 days left" holds for the whole day even a few hours before the
 * trial's exact end timestamp). Returns null when there's no trial end date.
 */
export function getTrialDaysRemaining(
  trialEndsAt: string | null | undefined,
): number | null {
  if (!trialEndsAt) return null;
  const endsAt = dayjs(trialEndsAt);
  if (!endsAt.isValid()) return null;
  return endsAt.startOf("day").diff(dayjs().startOf("day"), "day");
}

/** Whether today is one of the 3 reminder days (3, 2, or 1 days before trial end). */
export function shouldShowTrialEndingModal(
  trialEndsAt: string | null | undefined,
): boolean {
  const daysRemaining = getTrialDaysRemaining(trialEndsAt);
  return daysRemaining !== null && daysRemaining >= 1 && daysRemaining <= 3;
}

type Props = {
  visible: boolean;
  daysRemaining: number;
  onUpgrade: () => void;
  onClose: () => void;
};

export function TrialEndingModal({
  visible,
  daysRemaining,
  onUpgrade,
  onClose,
}: Props) {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);

  const dayLabel = daysRemaining === 1 ? "1 dzień" : `${daysRemaining} dni`;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={styles.container}
      >
        <View style={styles.iconWrap}>
          <Icon
            source="clock-alert-outline"
            size={36}
            color={theme.colors.primary}
          />
        </View>
        <Text style={styles.title}>
          Twój okres próbny kończy się za {dayLabel}
        </Text>
        <Text style={styles.body}>
          Po zakończeniu trialu stracisz dostęp do funkcji Premium:
          nielimitowanych grządek i upraw, pełnej biblioteki wiedzy,
          planowania ogrodu i automatycznych powiadomień — a konto wróci do
          planu Free z jego ograniczeniami.
        </Text>
        <Button
          mode="contained"
          style={styles.cta}
          contentStyle={styles.ctaContent}
          onPress={onUpgrade}
        >
          Wykup Premium
        </Button>
        <Button mode="text" onPress={onClose}>
          Przypomnij później
        </Button>
      </Modal>
    </Portal>
  );
}

function makeStyles(theme: MD3Theme) {
  return StyleSheet.create({
    container: {
      margin: 24,
      borderRadius: 24,
      backgroundColor: theme.colors.surface,
      borderWidth: theme.dark ? 1 : 0,
      borderColor: "rgba(255, 255, 255, 0.12)",
      padding: 28,
      alignItems: "center",
      gap: 12,
    },
    iconWrap: {
      width: 72,
      height: 72,
      borderRadius: 22,
      backgroundColor: theme.colors.primaryContainer,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    title: {
      fontSize: 22,
      fontWeight: "700",
      color: theme.colors.onSurface,
      textAlign: "center",
      lineHeight: 30,
    },
    body: {
      fontSize: 15,
      lineHeight: 23,
      color: theme.colors.onSurface,
      textAlign: "center",
    },
    cta: {
      marginTop: 8,
      borderRadius: 14,
      alignSelf: "stretch",
    },
    ctaContent: {
      paddingVertical: 6,
    },
  });
}
