"use client";

/**
 * Image with basic protection: no right-click save, no drag.
 * Used when FEATURE_IMAGE_PROTECTION is enabled.
 */

import Image from "next/image";

type Props = React.ComponentProps<typeof Image>;

export function ProtectedImage(props: Props) {
  const { className, style, src, alt, ...rest } = props;

  return (
    <span className={`relative block w-full h-full ${className ?? ""}`.trim()} style={style}>
      <Image
        src={src}
        alt={alt ?? ""}
        fill
        sizes="100vw"
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
        style={{ userSelect: "none", WebkitUserSelect: "none" }}
        className="object-cover"
        {...rest}
      />
    </span>
  );
}
