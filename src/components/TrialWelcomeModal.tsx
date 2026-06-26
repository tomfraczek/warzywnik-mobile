import AsyncStorage from "@react-native-async-storage/async-storage";
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

const TRIAL_WELCOME_KEY_PREFIX = "seen_trial_welcome_modal_v1:";

export function getTrialWelcomeStorageKey(userId: string): string {
  return `${TRIAL_WELCOME_KEY_PREFIX}${userId}`;
}

export async function hasSeenTrialWelcomeModal(
  userId: string,
): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(
      getTrialWelcomeStorageKey(userId),
    );
    return value === "true";
  } catch {
    return false;
  }
}

export async function markTrialWelcomeModalSeen(
  userId: string,
): Promise<void> {
  try {
    await AsyncStorage.setItem(getTrialWelcomeStorageKey(userId), "true");
  } catch {
    // ignore storage failures
  }
}

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function TrialWelcomeModal({ visible, onClose }: Props) {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={styles.container}
      >
        <View style={styles.iconWrap}>
          <Icon source="crown" size={36} color={theme.colors.primary} />
        </View>
        <Text style={styles.title}>Masz 7 dni Premium za darmo</Text>
        <Text style={styles.body}>
          Przez najbliższe 7 dni możesz korzystać ze wszystkich funkcji
          Warzywnika Premium: nielimitowanych grządek i upraw, pełnej biblioteki
          wiedzy, planowania ogrodu i automatycznych powiadomień.
        </Text>
        <Text style={styles.hint}>
          Nie musisz podawać karty. Po okresie próbnym konto przejdzie na plan
          Free.
        </Text>
        <Button
          mode="contained"
          style={styles.cta}
          contentStyle={styles.ctaContent}
          onPress={onClose}
        >
          Rozpocznij korzystanie
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
    hint: {
      fontSize: 13,
      lineHeight: 20,
      color: theme.colors.onSurfaceVariant,
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
