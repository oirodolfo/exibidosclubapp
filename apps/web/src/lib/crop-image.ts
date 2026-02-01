/**
 * Produce a square cropped image blob from image URL and crop area (pixels).
 * Used for profile photo: store square, display circle.
 */
export type Area = { x: number; y: number; width: number; height: number };

export function createCroppedImageBlob(
  imageUrl: string,
  crop: Area,
  mime: "image/jpeg" | "image/png" | "image/webp" = "image/jpeg",
  quality = 0.9
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = crop.width;
      canvas.height = crop.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Canvas 2d context not available"));
        return;
      }

      ctx.drawImage(
        img,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        crop.width,
        crop.height
      );

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("toBlob failed"));
        },
        mime,
        quality
      );
    };

    img.onerror = () => reject(new Error("Image load failed"));
    img.src = imageUrl;
  });
}
