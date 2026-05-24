/**
 * يرفع صورة Base64 إلى Cloudinary عن طريق API Route
 * @param base64String - الصورة كـ Base64 (data:image/jpeg;base64,...)
 * @param folder - مجلد في Cloudinary (اختياري)
 */
export async function uploadBase64Image(
  base64String: string,
  folder: string = "stationery-store"
): Promise<string> {
  try {
    // ✅ تحويل Base64 لـ Blob عشان نبعته كـ FormData
    const response = await fetch(base64String);
    const blob = await response.blob();
    
    const formData = new FormData();
    formData.append("file", blob, "image.jpg");
    formData.append("folder", folder);

    const uploadResponse = await fetch('/api/upload', {
      method: 'POST',
      body: formData, // ✅ FormData مش JSON
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to upload image');
    }

    const data = await uploadResponse.json();
    return data.url;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

/**
 * يرفع ملف File مباشرة (للـ Input type="file")
 */
export async function uploadFile(
  file: File,
  folder: string = "stationery-store"
): Promise<string> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to upload file');
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

/**
 * حذف صورة من Cloudinary (محتاج public_id)
 */
export async function deleteImageFromStorage(publicId: string): Promise<void> {
  try {
    const response = await fetch('/api/upload/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicId }),
    });

    if (!response.ok) {
      throw new Error('Failed to delete image');
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
}