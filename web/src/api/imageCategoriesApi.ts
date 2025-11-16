import axios from './axios';

export async function getImageCategories() {
  const res = await axios.get('/image-categories');
  return res.data;
}

export async function updateImageCategory(key: string, localPath: string) {
  const res = await axios.patch('/image-categories', { key, localPath });
  return res.data;
}
