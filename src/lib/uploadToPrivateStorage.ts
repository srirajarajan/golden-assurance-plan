import { supabase } from '@/integrations/supabase/client';

/**
 * Upload image to private applications-images bucket
 * Returns the file path (not public URL) for edge function to access
 */
export const uploadImageToPrivateStorage = async (
  file: File,
  fieldName: string,
  userId: string
): Promise<string | null> => {
  try {
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${fieldName}_${timestamp}.${fileExt}`;
    // Store under user's folder for RLS policy
    const filePath = `${userId}/${fileName}`;

    console.log(`Uploading ${fieldName} to private storage: ${filePath}`);

    const { error: uploadError } = await supabase.storage
      .from('applications-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Private storage upload error:', uploadError);
      return null;
    }

    console.log(`Successfully uploaded ${fieldName} to: ${filePath}`);
    // Return the path, not the URL - the edge function will access it directly
    return filePath;
  } catch (error) {
    console.error('Error uploading to private storage:', error);
    return null;
  }
};

/**
 * Compress image file before upload
 */
export const compressImageFile = (
  file: File,
  maxWidth: number = 1200,
  quality: number = 0.8
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};
