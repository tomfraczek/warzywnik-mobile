import { ActionTemplate } from "@/src/api/queries/beds/harvestTypes";
import { memo, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  Button,
  Checkbox,
  MD3Theme,
  Modal,
  Portal,
  useTheme,
} from "react-native-paper";

type TaskSelection = {
  templateId: string;
  dueAt?: string;
};

type PostHarvestActionsModalProps = {
  visible: boolean;
  actions: ActionTemplate[];
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (selection: TaskSelection[]) => void;
};

const resolveTemplateId = (action: ActionTemplate) =>
  action.templateId ?? action.id ?? null;

function PostHarvestActionsModalComponent({
  visible,
  actions,
  isSubmitting,
  onCancel,
  onSubmit,
}: PostHarvestActionsModalProps) {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

  const selectableActions = useMemo(
    () =>
      actions
        .map((action) => ({
          ...action,
          resolvedTemplateId: resolveTemplateId(action),
        }))
        .filter((action) => !!action.resolvedTemplateId),
    [actions],
  );

  useEffect(() => {
    if (!visible) return;

    // Default behavior: preselect all available post-harvest actions.
    const initialSelection = selectableActions.reduce<Record<string, boolean>>(
      (acc, action) => {
        if (action.resolvedTemplateId) {
          acc[action.resolvedTemplateId] = true;
        }
        return acc;
      },
      {},
    );

    setSelectedIds(initialSelection);
  }, [visible, selectableActions]);

  const selectedCount = useMemo(
    () => Object.values(selectedIds).filter(Boolean).length,
    [selectedIds],
  );

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
        <Text style={styles.title}>Po zbiorach</Text>
        <Text style={styles.subtitle}>Wybierz zadania do utworzenia.</Text>

        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
        >
          {selectableActions.length === 0 ? (
            <Text style={styles.emptyText}>Brak akcji do dodania.</Text>
          ) : (
            selectableActions.map((action) => {
              if (!action.resolvedTemplateId) {
                return null;
              }

              const checked = !!selectedIds[action.resolvedTemplateId];

              return (
                <Pressable
                  key={action.resolvedTemplateId}
                  style={styles.row}
                  onPress={() =>
                    setSelectedIds((prev) => ({
                      ...prev,
                      [action.resolvedTemplateId as string]: !checked,
                    }))
                  }
                >
                  <Checkbox
                    status={checked ? "checked" : "unchecked"}
                    onPress={() =>
                      setSelectedIds((prev) => ({
                        ...prev,
                        [action.resolvedTemplateId as string]: !checked,
                      }))
                    }
                  />
                  <View style={styles.rowTextWrap}>
                    <Text style={styles.actionName}>{action.name}</Text>
                    {action.description ? (
                      <Text style={styles.actionDescription}>
                        {action.description}
                      </Text>
                    ) : null}
                    <Text style={styles.actionDueAt}>Termin: Dziś</Text>
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>

        <View style={styles.actionsRow}>
          <Button
            mode="text"
            onPress={onCancel}
            disabled={isSubmitting}
            style={styles.actionButton}
          >
            Anuluj
          </Button>
          <Button
            mode="contained"
            onPress={() => {
              const selection = selectableActions
                .filter(
                  (action) =>
                    !!action.resolvedTemplateId &&
                    selectedIds[action.resolvedTemplateId],
                )
                .map((action) => ({
                  templateId: action.resolvedTemplateId as string,
                }));

              onSubmit(selection);
            }}
            loading={isSubmitting}
            disabled={isSubmitting || selectedCount === 0}
            style={styles.actionButton}
          >
            Dodaj zadania
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

export const PostHarvestActionsModal = memo(PostHarvestActionsModalComponent);

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    modal: {
      marginHorizontal: 16,
      borderRadius: 16,
      padding: 16,
      gap: 14,
      backgroundColor: theme.colors.surface,
      maxHeight: "82%",
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    list: {
      maxHeight: 360,
    },
    listContent: {
      gap: 8,
    },
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: 12,
      paddingVertical: 10,
      paddingRight: 10,
      backgroundColor: theme.colors.surface,
    },
    rowTextWrap: {
      flex: 1,
      paddingTop: 4,
    },
    actionName: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    actionDescription: {
      marginTop: 4,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    actionDueAt: {
      marginTop: 6,
      fontSize: 12,
      color: theme.colors.primary,
      fontWeight: "600",
    },
    emptyText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    actionsRow: {
      flexDirection: "row",
      gap: 10,
    },
    actionButton: {
      flex: 1,
    },
  });
