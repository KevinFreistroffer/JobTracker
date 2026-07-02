import { OpportunityStatus } from "@prisma/client";
import { cva, type VariantProps } from "class-variance-authority";
import { STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      status: {
        NEW: "bg-slate-100 text-slate-700",
        RESPONDED: "bg-blue-100 text-blue-700",
        INTERVIEWING: "bg-amber-100 text-amber-800",
        INTERVIEWED: "bg-purple-100 text-purple-700",
        OFFER: "bg-emerald-100 text-emerald-800",
        REJECTED: "bg-red-100 text-red-700",
        NO_RESPONSE: "bg-gray-100 text-gray-600",
        WITHDRAWN: "bg-orange-100 text-orange-700",
      },
    },
    defaultVariants: {
      status: "NEW",
    },
  },
);

type StatusBadgeProps = VariantProps<typeof statusBadgeVariants> & {
  status: OpportunityStatus;
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ status }), className)}>
      {STATUS_LABELS[status]}
    </span>
  );
}
