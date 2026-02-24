import { ActionTemplate } from "@/src/api/queries/beds/harvestTypes";
import { memo, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  Button,
  Checkbox,
  MD3Theme,
  Modal,
  Portal,
  TextInput,
  useTheme,
} from "react-native-paper";
import { DatePickerModal } from "react-native-paper-dates";

type TaskSelection = {
  actionTemplateId: string;
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
  action.actionTemplateId ?? action.templateId ?? action.id ?? null;

const pad2 = (n: number) => String(n).padStart(2, "0");

const toDateOnly = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
};

const toDate = (value?: string | null) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const getDefaultDueDateIso = (offsetDays?: number | null) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  if (typeof offsetDays === "number" && Number.isFinite(offsetDays)) {
    date.setDate(date.getDate() + offsetDays);
  }
  return date.toISOString();
};

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
  const [dueAtByTemplateId, setDueAtByTemplateId] = useState<
    Record<string, string>
  >({});
  const [pickerTemplateId, setPickerTemplateId] = useState<string | null>(null);

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

    // Initialize default due dates using offset from proposal.
    const initialDueAt = selectableActions.reduce<Record<string, string>>(
      (acc, action) => {
        if (!action.resolvedTemplateId) {
          return acc;
        }

        acc[action.resolvedTemplateId] = getDefaultDueDateIso(
          action.defaultDueOffsetDays,
        );
        return acc;
      },
      {},
    );

    setDueAtByTemplateId(initialDueAt);
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

                    <Pressable
                      onPress={() =>
                        checked &&
                        setPickerTemplateId(action.resolvedTemplateId)
                      }
                    >
                      <TextInput
                        mode="outlined"
                        label="Termin"
                        value={toDateOnly(
                          dueAtByTemplateId[action.resolvedTemplateId],
                        )}
                        editable={false}
                        disabled={!checked}
                        right={<TextInput.Icon icon="calendar" />}
                        style={styles.dueAtInput}
                      />
                    </Pressable>
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
                  actionTemplateId: action.resolvedTemplateId as string,
                  dueAt: dueAtByTemplateId[action.resolvedTemplateId as string],
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

      <DatePickerModal
        locale="pl"
        mode="single"
        visible={!!pickerTemplateId}
        date={
          pickerTemplateId
            ? (toDate(dueAtByTemplateId[pickerTemplateId]) ?? new Date())
            : new Date()
        }
        onDismiss={() => setPickerTemplateId(null)}
        onConfirm={({ date }) => {
          if (!pickerTemplateId || !date) {
            setPickerTemplateId(null);
            return;
          }

          setDueAtByTemplateId((prev) => ({
            ...prev,
            [pickerTemplateId]: date.toISOString(),
          }));
          setPickerTemplateId(null);
        }}
      />
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
    dueAtInput: {
      marginTop: 8,
      backgroundColor: theme.colors.surface,
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
