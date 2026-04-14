import { create } from 'zustand';

interface QuickAction {
  id: string;
  type: 'milestone' | 'invoice';
  title: string;
  subtitle: string;
  amount?: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueTime: string;
  status?: string;
}

interface QuickActionState {
  actions: QuickAction[];
  loading: boolean;
  error: string | null;
  setActions: (actions: QuickAction[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getCount: () => number;
}

export const useQuickActionStore = create<QuickActionState>((set, get) => ({
  actions: [],
  loading: false,
  error: null,

  setActions: (actions) => set({ actions }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  getCount: () => {
    const state = get();
    return state.actions.length;
  },
}));
