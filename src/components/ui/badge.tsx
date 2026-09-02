import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-pill px-3 py-1 text-caption font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-[rgba(255,90,60,0.12)] text-[var(--accent-primary)] border border-[rgba(255,90,60,0.2)]",
        secondary:
          "bg-[var(--glass-fill-subtle)] text-[var(--text-secondary)] border border-[var(--glass-border)]",
        success:
          "bg-[rgba(52,199,89,0.12)] text-[var(--accent-success)] border border-[rgba(52,199,89,0.2)]",
        warning:
          "bg-[rgba(255,159,10,0.12)] text-[var(--accent-warning)] border border-[rgba(255,159,10,0.2)]",
        danger:
          "bg-[rgba(255,59,48,0.12)] text-[var(--accent-danger)] border border-[rgba(255,59,48,0.2)]",
        outline:
          "border-[var(--glass-border)] text-[var(--text-secondary)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
