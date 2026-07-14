import { getResponseError } from "@/src/api/axios";
import {
  ContactMessageCategory,
  useCreateContactMessage,
} from "@/src/api/mutations/contactMessages/useCreateContactMessage";
import { useCreateVegetableSuggestion } from "@/src/api/mutations/vegetableSuggestions/useCreateVegetableSuggestion";
import { Screen } from "@/src/components/Screen";
import CustomHeader from "@/src/components/navigation/CustomHeader";
import { BottomSheetModal } from "@/src/components/ui/BottomSheetModal";
import {
  CONTACT_FORM_CATEGORY_OPTIONS,
  ContactFormCategory,
  SUGGEST_VEGETABLE_CATEGORY,
} from "@/src/features/contact/contactCategories";
import { OFFLINE_MUTATION_MESSAGE } from "@/src/features/network/offline";
import { useIsOffline } from "@/src/hooks/useNetworkStatus";
import { radius, spacing } from "@/src/theme/ui";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  Button,
  Icon,
  MD3Theme,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

const CONTENT_MIN_LENGTH = 1;
const CONTENT_MAX_LENGTH = 5000;
const VEGETABLE_NAME_MIN_LENGTH = 2;
const VEGETABLE_NAME_MAX_LENGTH = 80;
const VEGETABLE_NOTE_MAX_LENGTH = 500;

type FormErrors = {
  category?: string;
  content?: string;
  vegetableName?: string;
  vegetableNote?: string;
};

export default function ContactScreen() {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const router = useRouter();
  const isOffline = useIsOffline();
  const createContactMessage = useCreateContactMessage();
  const createVegetableSuggestion = useCreateVegetableSuggestion();

  const [category, setCategory] = useState<ContactFormCategory | null>(null);
  const [content, setContent] = useState("");
  const [vegetableName, setVegetableName] = useState("");
  const [vegetableNote, setVegetableNote] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [showCategorySheet, setShowCategorySheet] = useState(false);

  const isVegetableSuggestion = category === SUGGEST_VEGETABLE_CATEGORY;
  const isSubmitting =
    createContactMessage.isPending || createVegetableSuggestion.isPending;

  const selectedCategoryLabel = CONTACT_FORM_CATEGORY_OPTIONS.find(
    (option) => option.value === category,
  )?.label;

  const validate = useCallback((): FormErrors => {
    const nextErrors: FormErrors = {};

    if (!category) {
      nextErrors.category = "Wybierz kategorię.";
      return nextErrors;
    }

    if (category === SUGGEST_VEGETABLE_CATEGORY) {
      const trimmedName = vegetableName.trim();
      if (trimmedName.length < VEGETABLE_NAME_MIN_LENGTH) {
        nextErrors.vegetableName = "Nazwa musi mieć co najmniej 2 znaki.";
      } else if (trimmedName.length > VEGETABLE_NAME_MAX_LENGTH) {
        nextErrors.vegetableName = "Nazwa może mieć maksymalnie 80 znaków.";
      }
      if (vegetableNote.trim().length > VEGETABLE_NOTE_MAX_LENGTH) {
        nextErrors.vegetableNote = "Notatka może mieć maksymalnie 500 znaków.";
      }
      return nextErrors;
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length < CONTENT_MIN_LENGTH) {
      nextErrors.content = "Wpisz treść wiadomości.";
    } else if (trimmedContent.length > CONTENT_MAX_LENGTH) {
      nextErrors.content = "Wiadomość może mieć maksymalnie 5000 znaków.";
    }

    return nextErrors;
  }, [category, content, vegetableName, vegetableNote]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;

    if (isOffline) {
      Alert.alert("Tryb offline", OFFLINE_MUTATION_MESSAGE);
      return;
    }

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      if (category === SUGGEST_VEGETABLE_CATEGORY) {
        await createVegetableSuggestion.mutateAsync({
          name: vegetableName.trim(),
          note: vegetableNote.trim() || null,
        });

        Alert.alert(
          "Propozycja wysłana",
          "Dziękujemy! Postaramy się dodać warzywo jak najszybciej.",
          [{ text: "OK", onPress: () => router.back() }],
        );
        return;
      }

      await createContactMessage.mutateAsync({
        category: category as ContactMessageCategory,
        content: content.trim(),
      });

      Alert.alert(
        "Wiadomość wysłana",
        "Dziękujemy za kontakt. Odpowiemy na Twój adres e-mail przypisany do konta.",
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (error) {
      if (__DEV__) {
        console.error("Failed to send contact form", getResponseError(error));
      }
      Alert.alert(
        "Nie udało się wysłać wiadomości",
        "Spróbuj ponownie za chwilę.",
      );
    }
  }, [
    category,
    content,
    createContactMessage,
    createVegetableSuggestion,
    isOffline,
    isSubmitting,
    router,
    validate,
    vegetableName,
    vegetableNote,
  ]);

  return (
    <Screen
      style={styles.container}
      safeAreaEdges={["left", "right", "bottom"]}
    >
      <CustomHeader title="Skontaktuj się z nami" showBack />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.intro}>
            Masz pytanie, pomysł lub problem z aplikacją? Wybierz kategorię i
            opisz sprawę. Odpowiemy na adres e-mail przypisany do Twojego
            konta.
          </Text>

          <Text style={styles.label}>Kategoria</Text>
          <Pressable
            style={[
              styles.selector,
              errors.category ? styles.selectorError : null,
            ]}
            onPress={() => setShowCategorySheet(true)}
          >
            <Text
              style={
                selectedCategoryLabel
                  ? styles.selectorValue
                  : styles.selectorPlaceholder
              }
            >
              {selectedCategoryLabel ?? "Wybierz kategorię"}
            </Text>
            <Icon
              source="chevron-down"
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
          </Pressable>
          {errors.category ? (
            <Text style={styles.errorText}>{errors.category}</Text>
          ) : null}

          {isVegetableSuggestion ? (
            <>
              <Text style={[styles.label, styles.fieldSpacing]}>
                Nazwa warzywa
              </Text>
              <TextInput
                mode="outlined"
                value={vegetableName}
                onChangeText={(value) => {
                  setVegetableName(value);
                  if (errors.vegetableName) {
                    setErrors((prev) => ({
                      ...prev,
                      vegetableName: undefined,
                    }));
                  }
                }}
                maxLength={VEGETABLE_NAME_MAX_LENGTH}
                style={styles.input}
              />
              {errors.vegetableName ? (
                <Text style={styles.errorText}>{errors.vegetableName}</Text>
              ) : null}

              <Text style={[styles.label, styles.fieldSpacing]}>
                Dodatkowe uwagi (opcjonalnie)
              </Text>
              <TextInput
                mode="outlined"
                value={vegetableNote}
                onChangeText={(value) => {
                  setVegetableNote(value);
                  if (errors.vegetableNote) {
                    setErrors((prev) => ({
                      ...prev,
                      vegetableNote: undefined,
                    }));
                  }
                }}
                maxLength={VEGETABLE_NOTE_MAX_LENGTH}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={styles.textArea}
              />
              <View style={styles.counterRow}>
                <Text style={styles.errorText}>
                  {errors.vegetableNote ?? ""}
                </Text>
                <Text style={styles.counterText}>
                  {vegetableNote.length}/{VEGETABLE_NOTE_MAX_LENGTH}
                </Text>
              </View>
            </>
          ) : (
            <>
              <Text style={[styles.label, styles.fieldSpacing]}>
                Wiadomość
              </Text>
              <TextInput
                mode="outlined"
                placeholder="Opisz swoje pytanie, pomysł lub problem."
                value={content}
                onChangeText={(value) => {
                  setContent(value);
                  if (errors.content) {
                    setErrors((prev) => ({ ...prev, content: undefined }));
                  }
                }}
                maxLength={CONTENT_MAX_LENGTH}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                style={styles.textArea}
              />
              <View style={styles.counterRow}>
                <Text style={styles.errorText}>{errors.content ?? ""}</Text>
                <Text style={styles.counterText}>
                  {content.length}/{CONTENT_MAX_LENGTH}
                </Text>
              </View>
            </>
          )}

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
            style={styles.submitButton}
          >
            {isVegetableSuggestion ? "Wyślij propozycję" : "Wyślij wiadomość"}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomSheetModal
        visible={showCategorySheet}
        onDismiss={() => setShowCategorySheet(false)}
      >
        <Text style={styles.sheetTitle}>Wybierz kategorię</Text>
        {CONTACT_FORM_CATEGORY_OPTIONS.map((option) => {
          const isSelected = option.value === category;
          return (
            <Pressable
              key={option.value}
              style={[
                styles.sheetItem,
                isSelected ? styles.sheetItemActive : null,
              ]}
              onPress={() => {
                setCategory(option.value);
                setErrors((prev) => ({ ...prev, category: undefined }));
                setShowCategorySheet(false);
              }}
            >
              <Text style={styles.sheetItemText}>{option.label}</Text>
              {isSelected ? (
                <Icon source="check" size={20} color={theme.colors.primary} />
              ) : null}
            </Pressable>
          );
        })}
      </BottomSheetModal>
    </Screen>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    flex: {
      flex: 1,
    },
    content: {
      padding: spacing.md,
      paddingBottom: spacing.xl,
    },
    intro: {
      fontSize: 13,
      lineHeight: 19,
      color: theme.colors.onSurfaceVariant,
      marginBottom: spacing.md,
    },
    label: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      fontWeight: "600",
      marginBottom: spacing.sm,
    },
    fieldSpacing: {
      marginTop: spacing.md,
    },
    selector: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: radius.sm,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: 14,
    },
    selectorError: {
      borderColor: theme.colors.error,
    },
    selectorValue: {
      fontSize: 15,
      color: theme.colors.onSurface,
    },
    selectorPlaceholder: {
      fontSize: 15,
      color: theme.colors.onSurfaceVariant,
    },
    input: {
      backgroundColor: theme.colors.surface,
    },
    textArea: {
      backgroundColor: theme.colors.surface,
      minHeight: 140,
    },
    counterRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginTop: spacing.xs,
    },
    errorText: {
      flex: 1,
      fontSize: 12,
      color: theme.colors.error,
      marginRight: spacing.sm,
    },
    counterText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    submitButton: {
      marginTop: spacing.lg,
      borderRadius: radius.md,
    },
    sheetTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.colors.onSurface,
      marginBottom: spacing.xs,
    },
    sheetItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.sm,
    },
    sheetItemActive: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    sheetItemText: {
      fontSize: 15,
      color: theme.colors.onSurface,
    },
  });
