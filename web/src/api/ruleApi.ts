import axios from './axios';

export interface Rule {
  _id?: string;
  contains: string;
  category: string;
  supplier: string;
}

export async function fetchRules(): Promise<Rule[]> {
  const res = await axios.get('/rules');
  return res.data;
}

export async function addRule(rule: Rule): Promise<Rule> {
  const res = await axios.post('/rules', rule);
  return res.data;
}

export async function deleteRule(id: string): Promise<void> {
  await axios.delete(`/rules/${id}`);
}

export async function updateRule(id: string, rule: Partial<Rule>): Promise<Rule> {
  const res = await axios.put(`/rules/${id}`, rule);
  return res.data;
}
