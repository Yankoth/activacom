import {
  PHOTO_MAX_WIDTH,
  PHOTO_COMPRESSION_QUALITY,
  PHOTO_THUMBNAIL_WIDTH,
  PHOTO_THUMBNAIL_QUALITY,
} from '@activacom/shared/constants';

/**
 * Compresses an image file using Canvas API.
 * Resizes to max width and outputs JPEG at configured quality.
 */
export function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      if (width > PHOTO_MAX_WIDTH) {
        height = Math.round((height * PHOTO_MAX_WIDTH) / width);
        width = PHOTO_MAX_WIDTH;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Image compression failed'));
            return;
          }
          resolve(
            new File([blob], file.name.replace(/\.\w+$/, '.jpg'), {
              type: 'image/jpeg',
            }),
          );
        },
        'image/jpeg',
        PHOTO_COMPRESSION_QUALITY,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Generates a thumbnail from an already-compressed image.
 * Resizes to max PHOTO_THUMBNAIL_WIDTH and outputs JPEG at thumbnail quality.
 */
export function generateThumbnail(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      if (width > PHOTO_THUMBNAIL_WIDTH) {
        height = Math.round((height * PHOTO_THUMBNAIL_WIDTH) / width);
        width = PHOTO_THUMBNAIL_WIDTH;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Thumbnail generation failed'));
            return;
          }
          resolve(
            new File([blob], file.name.replace(/\.\w+$/, '_thumb.jpg'), {
              type: 'image/jpeg',
            }),
          );
        },
        'image/jpeg',
        PHOTO_THUMBNAIL_QUALITY,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for thumbnail'));
    };

    img.src = url;
  });
}
