import { create } from 'zustand';
import { fetchRules, addRule as apiAddRule, deleteRule as apiDeleteRule, updateRule as apiUpdateRule, Rule } from '../api/ruleApi';

interface RuleState {
  rules: Rule[];
  loading: boolean;
  fetchAll: () => Promise<void>;
  addRule: (rule: Rule) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
  updateRule: (id: string, rule: Partial<Rule>) => Promise<void>;
}

export const useRuleStore = create<RuleState>((set, get) => ({
  rules: [],
  loading: false,
  fetchAll: async () => {
    set({ loading: true });
    const rules = await fetchRules();
    set({ rules, loading: false });
  },
  addRule: async (rule) => {
    set({ loading: true });
    const newRule = await apiAddRule(rule);
    set({ rules: [...get().rules, newRule], loading: false });
  },
  deleteRule: async (id) => {
    set({ loading: true });
    await apiDeleteRule(id);
    set({ rules: get().rules.filter(r => r._id !== id), loading: false });
  },
  updateRule: async (id, rule) => {
    set({ loading: true });
    const updated = await apiUpdateRule(id, rule);
    set({ rules: get().rules.map(r => r._id === id ? updated : r), loading: false });
  },
}));
