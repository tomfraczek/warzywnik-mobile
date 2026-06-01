import { BottomSheetModal } from "@/src/components/ui/BottomSheetModal";
import dayjs from "dayjs";
import "dayjs/locale/pl";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, MD3Theme, Text, useTheme } from "react-native-paper";
import DateTimePicker, {
  DateType,
  useDefaultStyles,
} from "react-native-ui-datepicker";

dayjs.locale("pl");

export type AppDatePickerModalProps = {
  visible: boolean;
  date?: Date;
  onDismiss: () => void;
  onConfirm: (date: Date) => void;
};

const toDate = (value: DateType): Date | undefined => {
  if (!value) return undefined;
  const parsed = dayjs(value);
  if (!parsed.isValid()) return undefined;
  return parsed.toDate();
};

export function AppDatePickerModal({
  visible,
  date,
  onDismiss,
  onConfirm,
}: AppDatePickerModalProps) {
  const theme = useTheme<MD3Theme>();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const defaultCalendarStyles = useDefaultStyles();
  const [draftDate, setDraftDate] = useState<Date>(date ?? new Date());

  useEffect(() => {
    if (!visible) return;
    setDraftDate(date ?? new Date());
  }, [visible, date]);

  const calendarStyles = useMemo(
    () => ({
      ...defaultCalendarStyles,
      day_label: {
        ...defaultCalendarStyles.day_label,
        color: theme.colors.onSurface,
      },
      day_label_disabled: {
        ...defaultCalendarStyles.day_label_disabled,
        color: theme.colors.onSurfaceDisabled,
      },
      weekday_label: {
        ...defaultCalendarStyles.weekday_label,
        color: theme.colors.onSurfaceVariant,
      },
      header_title_text: {
        ...defaultCalendarStyles.header_title_text,
        color: theme.colors.onSurface,
      },
      header_button_text: {
        ...defaultCalendarStyles.header_button_text,
        color: theme.colors.onSurface,
      },
      today: {
        ...defaultCalendarStyles.today,
        borderColor: theme.colors.primary,
        borderWidth: 1,
        backgroundColor: "transparent",
      },
      today_label: {
        ...defaultCalendarStyles.today_label,
        color: theme.colors.onSurface,
      },
      selected: {
        ...defaultCalendarStyles.selected,
        backgroundColor: theme.colors.primary,
      },
      selected_label: {
        ...defaultCalendarStyles.selected_label,
        color: theme.colors.onPrimary,
      },
    }),
    [
      defaultCalendarStyles,
      theme.colors.onPrimary,
      theme.colors.onSurface,
      theme.colors.onSurfaceDisabled,
      theme.colors.onSurfaceVariant,
      theme.colors.primary,
    ],
  );

  return (
    <BottomSheetModal visible={visible} onDismiss={onDismiss}>
      <View style={styles.container}>
        <Text style={styles.title}>Wybierz datę</Text>

        <DateTimePicker
          mode="single"
          locale="pl"
          firstDayOfWeek={1}
          date={draftDate}
          onChange={({ date: nextDate }) => {
            const resolved = toDate(nextDate);
            if (!resolved) return;
            setDraftDate(resolved);
          }}
          monthCaptionFormat="full"
          monthsFormat="full"
          weekdaysFormat="short"
          containerHeight={292}
          styles={calendarStyles}
        />

        <View style={styles.actionsRow}>
          <Button mode="outlined" onPress={onDismiss} style={styles.actionBtn}>
            Anuluj
          </Button>
          <Button
            mode="contained"
            onPress={() => onConfirm(draftDate)}
            style={styles.actionBtn}
          >
            Zapisz
          </Button>
        </View>
      </View>
    </BottomSheetModal>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      gap: 12,
      paddingBottom: 4,
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.colors.onSurface,
      marginTop: 2,
    },
    actionsRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 2,
    },
    actionBtn: {
      flex: 1,
    },
  });
