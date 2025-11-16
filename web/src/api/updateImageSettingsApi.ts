import axios from './axios';

export async function updateImageSettings(localPath: string) {
  const res = await axios.patch('/image-settings', { localPath });
  return res.data;
}
