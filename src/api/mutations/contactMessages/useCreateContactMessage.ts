import { restClient } from "@/src/api/axios";
import { useMutation } from "@tanstack/react-query";

export type ContactMessageCategory =
  | "app_problem"
  | "feature_request"
  | "content_error"
  | "notifications_problem"
  | "premium_payments"
  | "question"
  | "other";

export type CreateContactMessagePayload = {
  category: ContactMessageCategory;
  content: string;
};

export type ContactMessage = {
  id: string;
  category: ContactMessageCategory;
  content: string;
  createdAt: string;
};

const createContactMessage = async (
  payload: CreateContactMessagePayload,
): Promise<ContactMessage> => {
  const { data } = await restClient.post("/contact-messages", payload);
  return data;
};

export const useCreateContactMessage = () =>
  useMutation({
    mutationFn: createContactMessage,
  });
