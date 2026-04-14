// API utilities and endpoints for Finance module

const API_BASE = import.meta.env.VITE_FINANCE_API || '/api';

// ==================== CHART OF ACCOUNTS ====================
export interface ChartOfAccount {
  id: number;
  account_code: string;
  account_name: string;
  account_type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export const chartOfAccountsAPI = {
  async getAll(): Promise<ChartOfAccount[]> {
    console.log('📡 Fetching from:', `${API_BASE}/chartofaccounts`);
    const res = await fetch(`${API_BASE}/chartofaccounts`);
    console.log('📡 Response status:', res.status);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const json = await res.json();
    console.log('📡 Response data:', json);
    return json.data || json || [];
  },
  async create(payload: Partial<ChartOfAccount>) {
    const res = await fetch(`${API_BASE}/chartofaccounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
  async update(id: number, payload: Partial<ChartOfAccount>) {
    const res = await fetch(`${API_BASE}/chartofaccounts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
  async delete(id: number) {
    const res = await fetch(`${API_BASE}/chartofaccounts/${id}`, { method: 'DELETE' });
    return res.json();
  },
};

// ==================== JOURNAL ENTRIES ====================
export interface JournalEntry {
  id: string;
  transaction_date: string;
  description?: string;
  account_id: number;
  debit?: number | string;
  credit?: number | string;
  reference_id?: string;
  reference_type?: string;
}

export type GeneralJournalLine = {
  account_id: number;
  debit?: number;
  credit?: number;
  description?: string;
};

export type CreateGeneralJournalDto = {
  transaction_date: string;
  description: string;
  reference_type?: string;
  lines: GeneralJournalLine[];
  created_by?: string;
};

export const journalEntriesAPI = {
  async getAll() {
    const res = await fetch(`${API_BASE}/journal-entries`);
    return res.json();
  },
  async create(payload: Partial<JournalEntry>) {
    const res = await fetch(`${API_BASE}/journal-entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
  async update(id: string | number, payload: Partial<JournalEntry>) {
    const res = await fetch(`${API_BASE}/journal-entries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
  async delete(id: string | number) {
    const res = await fetch(`${API_BASE}/journal-entries/${id}`, { method: 'DELETE' });
    return res.json();
  },
  async createGeneral(payload: CreateGeneralJournalDto) {
    const res = await fetch(`${API_BASE}/journal-entries/general`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to create general journal');
    }
    return res.json();
  },
};

// ==================== TAX RATES ====================
export type TaxRate = {
  id: number;
  tax_name: string;
  tax_code: string;
  rate: number;
  description?: string;
  is_active: boolean;
};

export const taxRatesAPI = {
  async getAll() {
    const res = await fetch(`${API_BASE}/tax-rates`);
    return res.json();
  },
  async create(payload: Omit<TaxRate, 'id'>) {
    const res = await fetch(`${API_BASE}/tax-rates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
  async update(id: number, payload: Partial<TaxRate>) {
    const res = await fetch(`${API_BASE}/tax-rates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
  async delete(id: number) {
    const res = await fetch(`${API_BASE}/tax-rates/${id}`, { method: 'DELETE' });
    return res.json();
  },
};

// ==================== EXCHANGE RATES ====================
export type ExchangeRate = {
  id: number;
  currency_from: string;
  currency_to: string;
  rate: number | string;
  effective_date: string;
  is_active: boolean;
};

export const exchangeRatesAPI = {
  async getAll(params?: { is_active?: boolean }) {
    const qs = params?.is_active !== undefined ? `?is_active=${params.is_active}` : '';
    const res = await fetch(`${API_BASE}/exchange-rates${qs}`);
    return res.json();
  },
  async create(payload: Omit<ExchangeRate, 'id'>) {
    const res = await fetch(`${API_BASE}/exchange-rates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
  async update(id: number, payload: Partial<ExchangeRate>) {
    const res = await fetch(`${API_BASE}/exchange-rates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
  async delete(id: number) {
    const res = await fetch(`${API_BASE}/exchange-rates/${id}`, { method: 'DELETE' });
    return res.json();
  },
};

// ==================== PRICING RULES ====================
export type PricingRule = {
  id: number;
  category: string;
  markup_percentage: number;
  created_at?: string;
  updated_at?: string;
};

export const pricingRulesAPI = {
  async getAll(): Promise<PricingRule[]> {
    const res = await fetch(`${API_BASE}/pricing-rules`);
    const data = await res.json();
    return data.success ? data.data : [];
  },
  async create(payload: Omit<PricingRule, 'id' | 'created_at' | 'updated_at'>) {
    const res = await fetch(`${API_BASE}/pricing-rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
  async update(id: number, payload: Partial<Omit<PricingRule, 'id' | 'created_at' | 'updated_at'>>) {
    const res = await fetch(`${API_BASE}/pricing-rules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
  async delete(id: number) {
    const res = await fetch(`${API_BASE}/pricing-rules/${id}`, { method: 'DELETE' });
    return res.json();
  },
};

// ==================== PAYMENT TERMS ====================
export type PaymentTerm = {
  id: number;
  term_name: string;
  term_code: string;
  days_until_due: number;
  discount_percentage?: number;
  discount_days?: number;
  description?: string;
  is_active: boolean;
};

export const paymentTermsAPI = {
  async getAll(params?: { is_active?: boolean }) {
    const qs = params?.is_active !== undefined ? `?is_active=${params.is_active}` : '';
    const res = await fetch(`${API_BASE}/payment-terms${qs}`);
    return res.json();
  },
  async getById(id: number) {
    const res = await fetch(`${API_BASE}/payment-terms/${id}`);
    return res.json();
  },
  async create(payload: Omit<PaymentTerm, 'id'>) {
    const res = await fetch(`${API_BASE}/payment-terms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
  async update(id: number, payload: Partial<PaymentTerm>) {
    const res = await fetch(`${API_BASE}/payment-terms/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
  async delete(id: number) {
    const res = await fetch(`${API_BASE}/payment-terms/${id}`, { method: 'DELETE' });
    return res.json();
  },
};

// ==================== EXPENSE CLAIM POLICIES ====================
export type ExpenseClaimPolicy = {
  id: number;
  policy_name: string;
  policy_code: string;
  max_claim_amount: number;
  approval_required: boolean;
  requires_receipt: boolean;
  description?: string;
  is_active: boolean;
};

export const expenseClaimPoliciesAPI = {
  async getAll(params?: { is_active?: boolean }) {
    const qs = params?.is_active !== undefined ? `?is_active=${params.is_active}` : '';
    const res = await fetch(`${API_BASE}/expense-claim-policies${qs}`);
    return res.json();
  },
  async getById(id: number) {
    const res = await fetch(`${API_BASE}/expense-claim-policies/${id}`);
    return res.json();
  },
  async create(payload: Omit<ExpenseClaimPolicy, 'id'>) {
    const res = await fetch(`${API_BASE}/expense-claim-policies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
  async update(id: number, payload: Partial<ExpenseClaimPolicy>) {
    const res = await fetch(`${API_BASE}/expense-claim-policies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
  async delete(id: number) {
    const res = await fetch(`${API_BASE}/expense-claim-policies/${id}`, { method: 'DELETE' });
    return res.json();
  },
};

// ==================== DISCOUNT POLICIES ====================
export type DiscountPolicy = {
  id: string;
  user_role: string;
  max_discount_percentage: number;
  requires_approval_above: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
};

export const discountPoliciesAPI = {
  async getAll() {
    const res = await fetch(`${API_BASE}/discount-policies`);
    return res.json();
  },
  async getById(id: string) {
    const res = await fetch(`${API_BASE}/discount-policies/${id}`);
    return res.json();
  },
  async create(payload: Omit<DiscountPolicy, 'id' | 'created_at' | 'updated_at'>) {
    const res = await fetch(`${API_BASE}/discount-policies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
  async update(id: string, payload: Partial<Omit<DiscountPolicy, 'id' | 'created_at' | 'updated_at'>>) {
    const res = await fetch(`${API_BASE}/discount-policies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
  async delete(id: string) {
    const res = await fetch(`${API_BASE}/discount-policies/${id}`, { method: 'DELETE' });
    return res.json();
  },
};

// ==================== MARGIN POLICIES ====================
export type MarginPolicy = {
  id: string;
  sbu: string;
  category: string;
  system?: string;
  sub_system?: string;
  component?: string;
  min_gross_margin: number;
  max_gross_margin: number;
  default_markup?: number;
  is_active: boolean;
  notes?: string;
  valid_from: string;
  valid_to: string;
  created_at?: string;
  updated_at?: string;
};

export const marginPoliciesAPI = {
  async getAll(params?: { sbu?: string; category?: string; active_on?: string }) {
    const qs = new URLSearchParams();
    if (params?.sbu) qs.append('sbu', params.sbu);
    if (params?.category) qs.append('category', params.category);
    if (params?.active_on) qs.append('active_on', params.active_on);
    const queryString = qs.toString();
    const res = await fetch(`${API_BASE}/margin-policies${queryString ? '?' + queryString : ''}`);
    return res.json();
  },
  async getById(id: string) {
    const res = await fetch(`${API_BASE}/margin-policies/${id}`);
    return res.json();
  },
  async create(payload: Omit<MarginPolicy, 'id' | 'created_at' | 'updated_at'>) {
    const res = await fetch(`${API_BASE}/margin-policies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
  async update(id: string, payload: Partial<Omit<MarginPolicy, 'id' | 'created_at' | 'updated_at'>>) {
    const res = await fetch(`${API_BASE}/margin-policies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
  async delete(id: string) {
    const res = await fetch(`${API_BASE}/margin-policies/${id}`, { method: 'DELETE' });
    return res.json();
  },
};

// ==================== INVOICE MILESTONES ====================
export type InvoiceMilestone = {
  id: string;
  invoice_id: string;
  project_id?: string;
  milestone_type: string;
  milestone_name: string;
  percentage: number;
  expected_amount: number;
  expected_date?: string;
  actual_date?: string;
  status: string;
  notes?: string;
  invoice_number?: string;
  invoice_amount?: number;
  invoice_status?: string;
  created_at?: string;
  updated_at?: string;
};

export const invoiceMilestonesAPI = {
  async getAll(params?: { project_id?: string; invoice_id?: string; status?: string }) {
    const qs = new URLSearchParams();
    if (params?.project_id) qs.append('project_id', params.project_id);
    if (params?.invoice_id) qs.append('invoice_id', params.invoice_id);
    if (params?.status) qs.append('status', params.status);
    const queryString = qs.toString();
    const res = await fetch(`${API_BASE}/invoice-milestones${queryString ? '?' + queryString : ''}`);
    return res.json();
  },
  async getById(id: string) {
    const res = await fetch(`${API_BASE}/invoice-milestones/${id}`);
    return res.json();
  },
  async create(payload: Omit<InvoiceMilestone, 'id' | 'created_at' | 'updated_at' | 'invoice_number' | 'invoice_amount' | 'invoice_status'>) {
    const res = await fetch(`${API_BASE}/invoice-milestones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
  async update(id: string, payload: Partial<Omit<InvoiceMilestone, 'id' | 'created_at' | 'updated_at'>>) {
    const res = await fetch(`${API_BASE}/invoice-milestones/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
  async delete(id: string) {
    const res = await fetch(`${API_BASE}/invoice-milestones/${id}`, { method: 'DELETE' });
    return res.json();
  },
};
