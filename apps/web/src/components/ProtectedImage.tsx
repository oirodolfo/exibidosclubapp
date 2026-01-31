"use client";

/**
 * Image with basic protection: no right-click save, no drag.
 * Used when FEATURE_IMAGE_PROTECTION is enabled.
 */

type Props = React.ImgHTMLAttributes<HTMLImageElement>;

export function ProtectedImage(props: Props) {
  return (
    <img
      {...props}
      draggable={false}
      onContextMenu={(e) => e.preventDefault()}
      style={{ ...props.style, userSelect: "none", WebkitUserSelect: "none" }}
    />
  );
}
