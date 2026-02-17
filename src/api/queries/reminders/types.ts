export type ReminderStatus = "pending" | "done" | "skipped";

export type Reminder = {
  id: string;
  status: ReminderStatus;
  type?: string | null;
  payload?: Record<string, unknown> | null;
  scheduledAt?: string | null;
  sentAt?: string | null;
  attempts?: number | null;
  lastError?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type ReminderListParams = {
  status?: ReminderStatus;
  page?: number;
  limit?: number;
};

export type UpdateReminderDto = {
  status: "done" | "skipped";
};
