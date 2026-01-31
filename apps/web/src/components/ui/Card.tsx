"use client";

import { forwardRef } from "react";
import { card, type CardVariants } from "@/lib/variants";
import { cn } from "@/lib/cn";

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    CardVariants {}

/**
 * EXIBIDOS card: chunky, rounded, layered, slightly floating.
 * Use variant "glass" for soft glassmorphism, "elevated" for glow.
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(card({ variant, padding }), className)}
      {...props}
    />
  )
);
Card.displayName = "Card";
