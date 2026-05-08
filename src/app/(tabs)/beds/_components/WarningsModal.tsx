import { Warning } from "@/src/api/queries/plantings/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { memo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, MD3Theme, Modal, Portal, useTheme } from "react-native-paper";

type WarningsModalProps = {
  visible: boolean;
  warnings: Warning[];
  onIgnore: () => void;
  onCancel: () => void;
};

type WarningSeverity = Warning["severity"];

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const interpolateWarningText = (
  text: string | null | undefined,
  details?: Record<string, unknown> | null,
) => {
  if (!text || !details) return text ?? "";
  return Object.entries(details).reduce((acc, [key, value]) => {
    const safeKey = escapeRegExp(key);
    return acc.replace(
      new RegExp(`\\{${safeKey}\\}`, "g"),
      value == null ? "" : String(value),
    );
  }, text);
};

function WarningsModalComponent({
  visible,
  warnings,
  onIgnore,
  onCancel,
}: WarningsModalProps) {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const getSeverityTone = (severity: WarningSeverity) => {
    if (severity === "CRITICAL") {
      return {
        bg: theme.dark ? "#2C1F1F" : "#FCEEF0",
        border: theme.dark ? "#503434" : "#F3D1D7",
        text: theme.dark ? "#E4A5AE" : "#A94A58",
      };
    }
    if (severity === "WARNING") {
      return {
        bg: theme.dark ? "#2A251B" : "#FDF5E8",
        border: theme.dark ? "#4A3D27" : "#F0DFC0",
        text: theme.dark ? "#E1C48B" : "#9B6E2A",
      };
    }

    return {
      bg: theme.dark ? "#1A2328" : "#EEF6FB",
      border: theme.dark ? "#2B3A42" : "#D3E7F4",
      text: theme.dark ? "#9FC6DD" : "#3F6C89",
    };
  };

  const getSeverityIcon = (severity: WarningSeverity) => {
    if (severity === "CRITICAL") return "alert";
    if (severity === "WARNING") return "alert";
    return "information";
  };

  if (!visible || warnings.length === 0) {
    return null;
  }

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onCancel}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.sheet}>
          <Text style={styles.title}>Wykryte ostrzeżenia</Text>
          <Text style={styles.subtitle}>
            Zanim dodasz uprawę, sprawdź wykryte uwagi i zdecyduj, czy chcesz je
            poprawić teraz.
          </Text>
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
          >
            {warnings.map((warning, index) => (
              <View
                key={`${warning.code}-${index}`}
                style={[
                  styles.card,
                  {
                    backgroundColor: getSeverityTone(warning.severity).bg,
                    borderColor: getSeverityTone(warning.severity).border,
                  },
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.iconWrap}>
                    <MaterialCommunityIcons
                      name={getSeverityIcon(warning.severity)}
                      size={18}
                      color={getSeverityTone(warning.severity).text}
                    />
                  </View>
                  <Text
                    style={[
                      styles.cardTitle,
                      { color: getSeverityTone(warning.severity).text },
                    ]}
                  >
                    {interpolateWarningText(warning.title, warning.details)}
                  </Text>
                </View>
                <Text style={styles.cardMessage}>
                  {interpolateWarningText(warning.message, warning.details)}
                </Text>
                {warning.hint ? (
                  <Text style={styles.cardHint}>
                    {interpolateWarningText(warning.hint, warning.details)}
                  </Text>
                ) : null}
              </View>
            ))}
          </ScrollView>
          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={onCancel}
              style={styles.secondaryButton}
            >
              Wróć i popraw
            </Button>
            <Button
              mode="contained"
              onPress={onIgnore}
              style={styles.primaryButton}
            >
              Ignoruj i dodaj
            </Button>
          </View>
        </View>
      </Modal>
    </Portal>
  );
}

export const WarningsModal = memo(WarningsModalComponent);

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    modalContainer: {
      paddingHorizontal: 16,
    },
    sheet: {
      backgroundColor: theme.colors.surface,
      padding: 20,
      borderRadius: 26,
      maxHeight: "80%",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1,
      shadowRadius: 14,
      elevation: 4,
    },
    title: {
      fontSize: 21,
      fontWeight: "700",
      marginBottom: 6,
      color: theme.colors.onSurface,
    },
    subtitle: {
      fontSize: 13,
      lineHeight: 19,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 14,
    },
    list: {
      maxHeight: "70%",
    },
    listContent: {
      paddingBottom: 20,
    },
    card: {
      borderRadius: 16,
      padding: 12,
      marginBottom: 10,
      borderWidth: 1,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 7,
      gap: 8,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: "600",
      flex: 1,
    },
    iconWrap: {
      width: 22,
      height: 22,
      alignItems: "center",
      justifyContent: "center",
    },
    cardMessage: {
      fontSize: 13,
      color: theme.colors.onSurface,
      marginBottom: 6,
    },
    cardHint: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    actions: {
      flexDirection: "row",
      gap: 10,
      marginTop: 6,
    },
    secondaryButton: {
      borderColor: theme.colors.outline,
      flex: 1,
      borderRadius: 14,
    },
    primaryButton: {
      flex: 1,
      borderRadius: 14,
    },
  });
