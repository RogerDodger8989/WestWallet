export async function restoreEconomyItem(item: EconomyItem): Promise<EconomyItem> {
	const res = await axios.post(API_URL + '/restore', item);
	return { ...res.data, id: res.data._id, displayId: res.data.displayId };
}

import axios from './axios';
import { EconomyItem } from '../store/useEconomyStore';

const API_URL = '/expenses';

export const economyApi = {
	/**
	 * Hämta alla economy-items för användaren
	 */
	async fetchEconomyItems(): Promise<EconomyItem[]> {
		try {
			const res = await axios.get(API_URL);
			const items = res.data.map((item: any) => ({ ...item, id: item._id, displayId: item.displayId }));
			console.log('[economyApi] fetchEconomyItems:', items);
			return items;
		} catch (err) {
			console.error('[economyApi] fetchEconomyItems error:', err);
			throw err;
		}
	},

	/**
	 * Skapa nytt economy-item
	 */
	 async addEconomyItem(item: { [key: string]: any }): Promise<EconomyItem> {
		 try {
			 const res = await axios.post(API_URL, item);
			 const newItem = { ...res.data, id: res.data._id, displayId: res.data.displayId };
			 console.log('[economyApi] addEconomyItem:', newItem);
			 return newItem;
		 } catch (err) {
			 console.error('[economyApi] addEconomyItem error:', err);
			 throw err;
		 }
	 },
	 async restoreEconomyItem(item: EconomyItem): Promise<EconomyItem> {
		 const res = await axios.post(API_URL + '/restore', item);
		 return { ...res.data, id: res.data._id, displayId: res.data.displayId };
	 },

	/**
	 * Uppdatera economy-item
	 */
	async updateEconomyItem(item: EconomyItem): Promise<EconomyItem> {
		try {
			const res = await axios.put(`${API_URL}/${item.id}`, item);
			const updated = { ...res.data, id: res.data._id, displayId: res.data.displayId };
			console.log('[economyApi] updateEconomyItem:', updated);
			return updated;
		} catch (err) {
			console.error('[economyApi] updateEconomyItem error:', err);
			throw err;
		}
	},

	/**
	 * Ta bort economy-item
	 */
	async deleteEconomyItem(id: string): Promise<void> {
		try {
			await axios.delete(`${API_URL}/${id}`);
			console.log('[economyApi] deleteEconomyItem:', id);
		} catch (err) {
			console.error('[economyApi] deleteEconomyItem error:', err);
			throw err;
		}
	},
};
