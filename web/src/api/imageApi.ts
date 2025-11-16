import axios from './axios';

export async function uploadImage(expenseId: string, files: File[], category?: string): Promise<string[]> {
  const formData = new FormData();
  files.forEach(file => formData.append('images', file));
  const url = category
    ? `/expenses/${expenseId}/images?category=${category}`
    : `/expenses/${expenseId}/images`;
  const res = await axios.post(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data.images;
}

export async function deleteImage(expenseId: string, imageId: string, category?: string): Promise<void> {
  const url = category
    ? `/expenses/${expenseId}/images/${imageId}?category=${category}`
    : `/expenses/${expenseId}/images/${imageId}`;
  await axios.delete(url);
}

export async function getImages(expenseId: string, category?: string): Promise<string[]> {
  const url = category
    ? `/expenses/${expenseId}/images?category=${category}`
    : `/expenses/${expenseId}/images`;
  const res = await axios.get(url);
  return res.data.images;
}
