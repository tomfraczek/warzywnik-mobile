import { BottomSheetModal } from "@/src/components/ui/BottomSheetModal";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button, TextInput } from "react-native-paper";

type AddManualChecklistItemSheetProps = {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (values: { title: string; description?: string | null }) => void;
  isSubmitting?: boolean;
};

export function AddManualChecklistItemSheet({
  visible,
  onDismiss,
  onSubmit,
  isSubmitting = false,
}: AddManualChecklistItemSheetProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!visible) {
      setTitle("");
      setDescription("");
    }
  }, [visible]);

  const trimmedTitle = title.trim();

  return (
    <BottomSheetModal
      visible={visible}
      onDismiss={onDismiss}
      dismissDisabled={isSubmitting}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Dodaj własny punkt</Text>

          <TextInput
            mode="outlined"
            label="Tytuł *"
            placeholder="np. Kupić nowe grabki"
            value={title}
            onChangeText={setTitle}
            disabled={isSubmitting}
          />

          <TextInput
            mode="outlined"
            label="Opis"
            placeholder="Dodaj krótki opis, jeśli chcesz"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            disabled={isSubmitting}
          />

          <View style={styles.actions}>
            <Button mode="outlined" onPress={onDismiss} disabled={isSubmitting}>
              Anuluj
            </Button>
            <Button
              mode="contained"
              onPress={() =>
                onSubmit({
                  title: trimmedTitle,
                  description: description.trim() || null,
                })
              }
              loading={isSubmitting}
              disabled={isSubmitting || trimmedTitle.length === 0}
            >
              Dodaj do checklisty
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1D2420",
  },
  actions: {
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
});
