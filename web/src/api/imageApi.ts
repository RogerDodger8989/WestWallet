import axios from './axios';

export async function uploadImage(expenseId: string, files: File[]): Promise<string[]> {
  const formData = new FormData();
  files.forEach(file => formData.append('images', file));
  const res = await axios.post(`/expenses/${expenseId}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data.images;
}

export async function deleteImage(expenseId: string, imageId: string): Promise<void> {
  await axios.delete(`/expenses/${expenseId}/images/${imageId}`);
}

export async function getImages(expenseId: string): Promise<string[]> {
  const res = await axios.get(`/expenses/${expenseId}/images`);
  return res.data.images;
}
