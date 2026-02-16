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

function WarningsModalComponent({
  visible,
  warnings,
  onIgnore,
  onCancel,
}: WarningsModalProps) {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const getSeverityColor = (severity: WarningSeverity) => {
    if (severity === "CRITICAL") return theme.colors.error;
    if (severity === "WARNING") return theme.colors.tertiary;
    return theme.colors.primary;
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
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
          >
            {warnings.map((warning, index) => (
              <View key={`${warning.code}-${index}`} style={styles.card}>
                <View
                  style={[
                    styles.severityBar,
                    { backgroundColor: getSeverityColor(warning.severity) },
                  ]}
                />
                <View style={styles.cardHeader}>
                  <View style={styles.iconWrap}>
                    <MaterialCommunityIcons
                      name={getSeverityIcon(warning.severity)}
                      size={18}
                      color={getSeverityColor(warning.severity)}
                    />
                  </View>
                  <Text style={styles.cardTitle}>{warning.title}</Text>
                </View>
                <Text style={styles.cardMessage}>{warning.message}</Text>
                {warning.hint ? (
                  <Text style={styles.cardHint}>{warning.hint}</Text>
                ) : null}
              </View>
            ))}
          </ScrollView>
          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={onCancel}
              style={styles.actionButton}
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
      padding: 16,
      borderRadius: 18,
      maxHeight: "80%",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
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
      paddingBottom: 24,
    },
    card: {
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
      backgroundColor: theme.colors.surfaceVariant,
      borderWidth: 0,
      overflow: "hidden",
      position: "relative",
    },
    severityBar: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
      gap: 8,
    },
    cardTitle: {
      fontSize: 14,
      fontWeight: "600",
      flex: 1,
      color: theme.colors.onSurface,
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
      marginBottom: 8,
    },
    cardHint: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    actions: {
      flexDirection: "column",
      gap: 10,
      marginTop: 12,
    },
    actionButton: {
      borderColor: theme.colors.outline,
      width: "100%",
    },
    primaryButton: {
      width: "100%",
    },
  });
