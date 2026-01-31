"use client";

import { forwardRef } from "react";
import { chip, type ChipVariants } from "@/lib/variants";
import { cn } from "@/lib/cn";

export interface ChipProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    ChipVariants {}

/**
 * EXIBIDOS chip: playful, colorful, almost collectible.
 * Use variant lime/purple/cyan/magenta/amber for accent; muted for neutral.
 */
export const Chip = forwardRef<HTMLSpanElement, ChipProps>(
  ({ className, variant, ...props }, ref) => (
    <span ref={ref} className={cn(chip({ variant }), className)} {...props} />
  )
);
Chip.displayName = "Chip";
