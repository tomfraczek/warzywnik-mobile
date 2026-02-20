import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button, MD3Theme, Modal, Portal, useTheme } from "react-native-paper";

type HarvestConfirmationModalProps = {
  visible: boolean;
  plantingTitle: string;
  isSubmitting?: boolean;
  onNo: () => void;
  onYes: () => void;
};

function HarvestConfirmationModalComponent({
  visible,
  plantingTitle,
  isSubmitting,
  onNo,
  onYes,
}: HarvestConfirmationModalProps) {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);

  if (!visible) {
    return null;
  }

  return (
    <Portal>
      <Modal
        visible={visible}
        dismissable={false}
        contentContainerStyle={styles.modal}
      >
        <Text style={styles.title}>Gotowe do zbioru</Text>
        <Text style={styles.message}>
          Czy zebrałeś plony z uprawy {plantingTitle}?
        </Text>

        <View style={styles.actionsRow}>
          <Button
            mode="outlined"
            onPress={onNo}
            disabled={isSubmitting}
            style={styles.actionButton}
          >
            Nie
          </Button>
          <Button
            mode="contained"
            onPress={onYes}
            loading={isSubmitting}
            disabled={isSubmitting}
            style={styles.actionButton}
          >
            Tak
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

export const HarvestConfirmationModal = memo(HarvestConfirmationModalComponent);

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    modal: {
      marginHorizontal: 16,
      borderRadius: 16,
      padding: 16,
      gap: 16,
      backgroundColor: theme.colors.surface,
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    message: {
      fontSize: 15,
      color: theme.colors.onSurface,
    },
    actionsRow: {
      flexDirection: "row",
      gap: 10,
    },
    actionButton: {
      flex: 1,
    },
  });
