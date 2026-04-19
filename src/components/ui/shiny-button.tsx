import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ShinyButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
}

const ShinyButton = forwardRef<HTMLButtonElement, ShinyButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <button ref={ref} className={cn("shiny-cta", className)} {...props}>
        <span>{children}</span>
      </button>
    );
  }
);
ShinyButton.displayName = "ShinyButton";

export { ShinyButton };
