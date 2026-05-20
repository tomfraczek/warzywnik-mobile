import { PlanChecklistItem } from "@/src/api/queries/bedPlan/types";
import { BottomSheetModal } from "@/src/components/ui/BottomSheetModal";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button, TextInput } from "react-native-paper";

type EditManualChecklistItemSheetProps = {
  item: PlanChecklistItem | null;
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (params: {
    itemId: string;
    title: string;
    description?: string | null;
  }) => void;
  isSubmitting?: boolean;
};

export function EditManualChecklistItemSheet({
  item,
  visible,
  onDismiss,
  onSubmit,
  isSubmitting = false,
}: EditManualChecklistItemSheetProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!visible || !item) return;
    setTitle(item.title);
    setDescription(item.description ?? "");
  }, [visible, item]);

  const trimmedTitle = title.trim();

  return (
    <BottomSheetModal
      visible={visible}
      onDismiss={onDismiss}
      dismissDisabled={isSubmitting}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Edytuj własny punkt</Text>

        <TextInput
          mode="outlined"
          label="Tytuł *"
          value={title}
          onChangeText={setTitle}
          disabled={isSubmitting}
        />

        <TextInput
          mode="outlined"
          label="Opis"
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
            onPress={() => {
              if (!item) return;
              onSubmit({
                itemId: item.id,
                title: trimmedTitle,
                description: description.trim() || null,
              });
            }}
            loading={isSubmitting}
            disabled={isSubmitting || !item || trimmedTitle.length === 0}
          >
            Zapisz
          </Button>
        </View>
      </View>
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
