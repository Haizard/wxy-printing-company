import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-h-[44px] active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-br from-[var(--accent-primary)] to-[#E84530] text-white shadow-[0_2px_12px_rgba(255,90,60,0.3)] hover:shadow-[0_4px_20px_rgba(255,90,60,0.4)] hover:scale-[0.98] rounded-md",
        destructive:
          "bg-[var(--accent-danger)] text-white shadow-sm hover:bg-[var(--accent-danger)]/90 rounded-md",
        outline:
          "bg-[var(--glass-fill-subtle)] backdrop-blur-[14px] border border-[var(--glass-border)] text-[var(--accent-primary)] hover:bg-[rgba(255,90,60,0.08)] rounded-md",
        secondary:
          "bg-[var(--glass-fill)] backdrop-blur-[14px] border border-[var(--glass-border)] text-[var(--text-primary)] hover:bg-[var(--glass-fill-strong)] rounded-md",
        ghost:
          "text-[var(--text-secondary)] hover:bg-[rgba(255,90,60,0.08)] hover:text-[var(--accent-primary)] rounded-md",
        link: "text-[var(--accent-primary)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 px-3 rounded-[var(--radius-sm)]",
        lg: "h-12 px-8 text-base rounded-md",
        icon: "h-10 w-10 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
