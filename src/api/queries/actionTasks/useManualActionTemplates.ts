import { restClient } from "@/src/api/axios";
import { useQuery } from "@tanstack/react-query";
import { ManualActionTemplate } from "./types";

type ManualActionTemplateTarget = "bed" | "planting";

type GetManualActionTemplatesParams = {
  target: ManualActionTemplateTarget;
  q?: string;
};

const resolveTemplateList = (payload: unknown): ManualActionTemplate[] => {
  if (Array.isArray(payload)) return payload as ManualActionTemplate[];

  if (payload && typeof payload === "object") {
    const normalized = payload as { items?: unknown; data?: unknown };
    if (Array.isArray(normalized.items)) {
      return normalized.items as ManualActionTemplate[];
    }
    if (Array.isArray(normalized.data)) {
      return normalized.data as ManualActionTemplate[];
    }
  }

  return [];
};

export const getManualActionTemplates = async ({
  target,
  q,
}: GetManualActionTemplatesParams): Promise<ManualActionTemplate[]> => {
  const { data } = await restClient.get("/action-templates/manual", {
    params: {
      target,
      q: q?.trim() || undefined,
    },
  });

  return resolveTemplateList(data);
};

export const useManualActionTemplates = (
  target: ManualActionTemplateTarget | null,
  q?: string,
) => {
  return useQuery({
    queryKey: ["action-templates", "manual", target, q?.trim() || ""],
    queryFn: () =>
      getManualActionTemplates({
        target: target as ManualActionTemplateTarget,
        q,
      }),
    enabled: Boolean(target),
  });
};
