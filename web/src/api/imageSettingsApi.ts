import axios from './axios';

export async function getImageSettings() {
  const res = await axios.get('/image-settings');
  return res.data;
}
