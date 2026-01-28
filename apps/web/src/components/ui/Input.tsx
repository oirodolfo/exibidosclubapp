import { forwardRef } from "react";
import { input, type InputVariants } from "@/lib/variants";
import { cn } from "@/lib/cn";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">, InputVariants {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <input ref={ref} className={cn(input({ error }), className)} {...props} />
  )
);
Input.displayName = "Input";
