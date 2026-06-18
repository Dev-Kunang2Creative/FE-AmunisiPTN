const MAX_WIDTH = 1280;
const MAX_HEIGHT = 720;
const QUALITY = 0.8;

export async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context tidak tersedia"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Force WebP output for better compression and modern web standard
      const outputType = "image/webp";

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Gagal mengompresi gambar"));
            return;
          }
          
          const fileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
          const compressed = new File([blob], fileName, {
            type: outputType,
            lastModified: Date.now(),
          });
          resolve(compressed);
        },
        outputType,
        QUALITY,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Gagal memuat gambar untuk kompresi"));
    };

    img.src = objectUrl;
  });
}
