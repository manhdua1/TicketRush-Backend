import type { Area } from "react-easy-crop";

function createImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = src;
  });
}

export async function getCroppedImageBlob(
  imageSrc: string,
  crop: Area,
  options?: {
    outputType?: string;
    quality?: number;
  },
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");

  canvas.width = Math.max(1, Math.round(crop.width));
  canvas.height = Math.max(1, Math.round(crop.height));

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas context not available");
  }

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  const outputType = options?.outputType ?? "image/png";
  const quality = options?.quality;

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(
      (value) => resolve(value),
      outputType,
      typeof quality === "number" ? quality : undefined,
    );
  });

  if (!blob) {
    throw new Error("Failed to generate cropped image");
  }

  return blob;
}
