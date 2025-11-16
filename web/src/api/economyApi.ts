import axios from './axios';
import { EconomyItem } from '../store/useEconomyStore';

const API_URL = '/expenses';

export async function fetchEconomyItems(): Promise<EconomyItem[]> {
	const res = await axios.get(API_URL);
	return res.data;
}

export async function addEconomyItem(item: Omit<EconomyItem, 'id'>): Promise<EconomyItem> {
	const res = await axios.post(API_URL, item);
	return res.data;
}

export async function updateEconomyItem(item: EconomyItem): Promise<EconomyItem> {
	const res = await axios.put(`${API_URL}/${item.id}`, item);
	return res.data;
}

export async function deleteEconomyItem(id: string): Promise<void> {
	await axios.delete(`${API_URL}/${id}`);
}
