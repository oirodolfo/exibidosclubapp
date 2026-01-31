"use client";

import { forwardRef } from "react";
import Image from "next/image";
import { avatar, type AvatarVariants } from "@/lib/variants";
import { cn } from "@/lib/cn";

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    AvatarVariants {
  src?: string | null;
  alt?: string;
  /** Fallback when no src: initials or icon */
  fallback?: React.ReactNode;
  /** Next/Image props (priority, loading, etc.) */
  imgProps?: Omit<
    React.ComponentPropsWithoutRef<typeof Image>,
    "src" | "alt" | "width" | "height" | "className"
  >;
}

const sizeMap = { sm: 32, md: 40, lg: 56, xl: 80 } as const;

/**
 * EXIBIDOS avatar: rounded-full, optional glow ring.
 * Personality-first; use ring for emphasis (lime/purple/cyan).
 */
export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      className,
      size,
      ring,
      src,
      alt = "",
      fallback,
      imgProps,
      ...props
    },
    ref
  ) => {
    const px = size ? sizeMap[size] : 40;

    return (
      <div
        ref={ref}
        className={cn(avatar({ size, ring }), className)}
        {...props}
      >
        {src ? (
          <Image
            src={src}
            alt={alt}
            width={px}
            height={px}
            className="object-cover w-full h-full"
            {...imgProps}
          />
        ) : (
          <span className="flex items-center justify-center w-full h-full text-exibidos-muted text-sm font-semibold bg-exibidos-elevated">
            {fallback ?? "?"}
          </span>
        )}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";
