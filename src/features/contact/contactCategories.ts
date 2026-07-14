import { ContactMessageCategory } from "@/src/api/mutations/contactMessages/useCreateContactMessage";

export const CONTACT_CATEGORY_LABELS: Record<ContactMessageCategory, string> =
  {
    app_problem: "Problem z aplikacją",
    feature_request: "Propozycja nowej funkcji",
    content_error: "Błąd w treści",
    notifications_problem: "Problem z powiadomieniami",
    premium_payments: "Premium i płatności",
    question: "Pytanie",
    other: "Inne",
  };

export const CONTACT_CATEGORY_OPTIONS: {
  value: ContactMessageCategory;
  label: string;
}[] = (
  Object.keys(CONTACT_CATEGORY_LABELS) as ContactMessageCategory[]
).map((value) => ({ value, label: CONTACT_CATEGORY_LABELS[value] }));

// Client-only pseudo-category: routes to the existing vegetable suggestions
// endpoint instead of POST /contact-messages, so it isn't part of
// ContactMessageCategory.
export const SUGGEST_VEGETABLE_CATEGORY = "suggest_vegetable" as const;

export type ContactFormCategory =
  | ContactMessageCategory
  | typeof SUGGEST_VEGETABLE_CATEGORY;

export const CONTACT_FORM_CATEGORY_OPTIONS: {
  value: ContactFormCategory;
  label: string;
}[] = [
  ...CONTACT_CATEGORY_OPTIONS,
  { value: SUGGEST_VEGETABLE_CATEGORY, label: "Zasugeruj warzywo" },
];
