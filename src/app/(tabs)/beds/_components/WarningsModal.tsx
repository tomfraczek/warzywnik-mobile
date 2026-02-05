import { Warning } from "@/src/api/queries/plantings/types";
import { memo } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type WarningsModalProps = {
  visible: boolean;
  warnings: Warning[];
  onClose: () => void;
};

const severityColors: Record<Warning["severity"], string> = {
  INFO: "#2563eb",
  WARNING: "#d97706",
  ERROR: "#dc2626",
};

function WarningsModalComponent({
  visible,
  warnings,
  onClose,
}: WarningsModalProps) {
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
          <Pressable style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Rozumiem</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export const WarningsModal = memo(WarningsModalComponent);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: "80%",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  list: {
    maxHeight: "70%",
  },
  listContent: {
    paddingBottom: 12,
  },
  card: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
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
  },
  cardSeverity: {
    fontSize: 11,
    color: "#6b7280",
  },
  cardMessage: {
    fontSize: 13,
    color: "#111827",
    marginBottom: 6,
  },
  cardHint: {
    fontSize: 12,
    color: "#6b7280",
  },
  button: {
    marginTop: 8,
    backgroundColor: "#111827",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
