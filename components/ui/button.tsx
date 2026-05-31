import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-primary text-white shadow-[0_8px_24px_-8px_rgba(59,130,246,0.5)] hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0",
        lawn:
          "bg-gradient-lawn text-white shadow-[0_8px_24px_-8px_rgba(34,197,94,0.5)] hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0",
        snowland:
          "bg-gradient-snowland text-white shadow-[0_8px_24px_-8px_rgba(56,189,248,0.5)] hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0",
        outline:
          "border border-surface-border bg-transparent text-foreground hover:bg-surface hover:border-white/20",
        ghost:
          "bg-transparent text-foreground hover:bg-surface",
        link:
          "bg-transparent text-foreground underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 rounded-full px-4 text-sm",
        md: "h-11 rounded-full px-6 text-sm",
        lg: "h-12 rounded-full px-8 text-base",
        xl: "h-14 rounded-full px-10 text-base",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
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
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
