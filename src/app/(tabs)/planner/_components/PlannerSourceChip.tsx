import { BadgeTone, StatusBadge } from "@/src/components/ui/StatusBadge";

type PlannerSourceChipProps = {
  label: string;
  tone?: BadgeTone;
};

export function PlannerSourceChip({
  label,
  tone = "neutral",
}: PlannerSourceChipProps) {
  return <StatusBadge label={label} tone={tone} />;
}
