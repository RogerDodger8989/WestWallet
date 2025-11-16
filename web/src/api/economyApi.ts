import axios from './axios';
import { EconomyItem } from '../store/useEconomyStore';

const API_URL = '/expenses';

export async function fetchEconomyItems(): Promise<EconomyItem[]> {
	 const res = await axios.get(API_URL);
	 // Mappa _id till id
	return res.data.map((item: any) => ({ ...item, id: item._id, displayId: item.displayId }));
}

export async function addEconomyItem(item: { [key: string]: any }): Promise<EconomyItem> {
	 const res = await axios.post(API_URL, item);
	return { ...res.data, id: res.data._id, displayId: res.data.displayId };
}

export async function updateEconomyItem(item: EconomyItem): Promise<EconomyItem> {
	 const res = await axios.put(`${API_URL}/${item.id || item._id}`, item);
	return { ...res.data, id: res.data._id, displayId: res.data.displayId };
}

export async function deleteEconomyItem(id: string): Promise<void> {
	 await axios.delete(`${API_URL}/${id}`);
}
