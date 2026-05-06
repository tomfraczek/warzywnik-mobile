import { restClient } from "@/src/api/axios";
import { useQuery } from "@tanstack/react-query";
import { quickActionKeys } from "./quickActionKeys";
import { QuickActionNote, QuickActionNotesResponse } from "./types";

const normalizeScope = (value: unknown): QuickActionNote["scope"] => {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "bed") return "bed";
  if (normalized === "planting") return "planting";
  return null;
};

const normalizeNote = (
  item: unknown,
  index: number,
): QuickActionNote | null => {
  if (!item || typeof item !== "object") return null;

  const row = item as Record<string, unknown>;
  const note =
    (typeof row.note === "string" && row.note) ||
    (typeof row.notes === "string" && row.notes) ||
    "";

  if (!note.trim()) return null;

  const occurredAt =
    (typeof row.occurredAt === "string" && row.occurredAt) ||
    (typeof row.time === "string" && row.time) ||
    (typeof row.createdAt === "string" && row.createdAt) ||
    (typeof row.updatedAt === "string" && row.updatedAt) ||
    null;

  return {
    id:
      (typeof row.id === "string" && row.id) ||
      `${occurredAt ?? "note"}-${index}`,
    note,
    occurredAt,
    createdAt: typeof row.createdAt === "string" ? row.createdAt : null,
    scope: normalizeScope(
      row.scope ?? row.noteScope ?? row.targetScope ?? row.actionScope,
    ),
  };
};

const getBedQuickActionNotes = async (
  bedId: string,
): Promise<QuickActionNotesResponse> => {
  const { data } = await restClient.get(`/beds/${bedId}/quick-actions/notes`);
  const rawItems: unknown[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.data)
        ? data.data
        : [];

  const items = rawItems
    .map((item, index) => normalizeNote(item, index))
    .filter((item): item is QuickActionNote => item !== null)
    .filter((item) => item.scope !== "planting")
    .sort((a, b) => (a.occurredAt ?? "").localeCompare(b.occurredAt ?? ""));

  return { items };
};

export const useGetBedQuickActionNotes = (bedId: string | null) => {
  return useQuery({
    queryKey: bedId
      ? quickActionKeys.bedNotes(bedId)
      : quickActionKeys.bedNotes("unknown"),
    queryFn: () => getBedQuickActionNotes(bedId as string),
    enabled: Boolean(bedId),
  });
};
