import { Warning } from "@/src/api/queries/plantings/types";
import { memo } from "react";
import { Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, MD3Theme, useTheme } from "react-native-paper";

type WarningsModalProps = {
  visible: boolean;
  warnings: Warning[];
  onClose: () => void;
};

type WarningSeverity = Warning["severity"];

const getSeverityColors = (
  theme: MD3Theme,
): Record<WarningSeverity, string> => ({
  INFO: theme.colors.primary,
  WARNING: theme.colors.tertiary,
  ERROR: theme.colors.error,
});

function WarningsModalComponent({
  visible,
  warnings,
  onClose,
}: WarningsModalProps) {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const severityColors = getSeverityColors(theme);

  return (
    <Modal transparent visible={visible} animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Wykryte ostrzeżenia</Text>
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
          >
            {warnings.map((warning, index) => (
              <View key={`${warning.code}-${index}`} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.severityDot,
                      { backgroundColor: severityColors[warning.severity] },
                    ]}
                  />
                  <Text style={styles.cardTitle}>{warning.title}</Text>
                  <Text style={styles.cardSeverity}>{warning.severity}</Text>
                </View>
                <Text style={styles.cardMessage}>{warning.message}</Text>
                {warning.hint ? (
                  <Text style={styles.cardHint}>{warning.hint}</Text>
                ) : null}
              </View>
            ))}
          </ScrollView>
          <Button mode="contained" onPress={onClose}>
            Rozumiem
          </Button>
        </View>
      </View>
    </Modal>
  );
}

export const WarningsModal = memo(WarningsModalComponent);

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: theme.colors.backdrop,
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: theme.colors.surface,
      padding: 16,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      maxHeight: "80%",
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 12,
      color: theme.colors.onSurface,
    },
    list: {
      maxHeight: "70%",
    },
    listContent: {
      paddingBottom: 12,
    },
    card: {
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: 12,
      padding: 12,
      marginBottom: 10,
      backgroundColor: theme.colors.surface,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 6,
    },
    severityDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 8,
    },
    cardTitle: {
      fontSize: 14,
      fontWeight: "600",
      flex: 1,
      color: theme.colors.onSurface,
    },
    cardSeverity: {
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
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
  });
