import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Injeta token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redireciona para login em 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: User }>('/auth/login', { email, password }),
  register: (data: { name: string; email: string; password: string }) =>
    api.post<{ token: string; user: User }>('/auth/register', data),
};

// ─── Contacts ────────────────────────────────────────────────────────────────
export const contactsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<ContactsResponse>('/contacts', { params }),
  create: (data: Partial<Contact>) => api.post<Contact>('/contacts', data),
  update: (id: string, data: Partial<Contact>) => api.put<Contact>(`/contacts/${id}`, data),
  delete: (id: string) => api.delete(`/contacts/${id}`),
  importCSV: (file: File, listId?: string) => {
    const fd = new FormData();
    fd.append('file', file);
    if (listId) fd.append('listId', listId);
    return api.post<ImportResult>('/contacts/import/csv', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getLists: () => api.get<ContactList[]>('/contacts/lists/all'),
  createList: (data: { name: string; description?: string }) =>
    api.post<ContactList>('/contacts/lists', data),
};

// ─── Campaigns ───────────────────────────────────────────────────────────────
export const campaignsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<CampaignsResponse>('/campaigns', { params }),
  getOne: (id: string) => api.get<Campaign>(`/campaigns/${id}`),
  create: (data: Partial<Campaign>) => api.post<Campaign>('/campaigns', data),
  launch: (id: string) => api.post(`/campaigns/${id}/launch`),
  pause: (id: string) => api.post(`/campaigns/${id}/pause`),
  cancel: (id: string) => api.post(`/campaigns/${id}/cancel`),
  getMessages: (id: string, params?: Record<string, unknown>) =>
    api.get(`/campaigns/${id}/messages`, { params }),
};

// ─── Templates ───────────────────────────────────────────────────────────────
export const templatesApi = {
  list: () => api.get<Template[]>('/templates'),
  create: (data: Partial<Template>) => api.post<Template>('/templates', data),
  submitToMeta: (id: string) => api.post(`/templates/${id}/submit`),
  syncFromMeta: () => api.post('/templates/sync'),
  delete: (id: string) => api.delete(`/templates/${id}`),
};

// ─── Reports ─────────────────────────────────────────────────────────────────
export const reportsApi = {
  dashboard: () => api.get<DashboardStats>('/reports/dashboard'),
  campaign: (id: string) => api.get(`/reports/campaigns/${id}`),
  optOuts: () => api.get('/reports/opt-outs'),
};

// ─── Types ───────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'OPERATOR';
}

export interface Contact {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  tags: string[];
  optedOut: boolean;
  createdAt: string;
}

export interface ContactList {
  id: string;
  name: string;
  description?: string;
  _count: { members: number };
}

export interface ContactsResponse {
  contacts: Contact[];
  total: number;
  page: number;
  pages: number;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  totalContacts: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;
  template: { id: string; name: string; category: string };
  contactList: { id: string; name: string };
  createdAt: string;
}

export interface CampaignsResponse {
  campaigns: Campaign[];
  total: number;
  page: number;
  pages: number;
}

export interface Template {
  id: string;
  name: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string;
  status: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PAUSED';
  body: string;
  headerType?: string;
  headerContent?: string;
  footer?: string;
}

export interface DashboardStats {
  totals: {
    contacts: number;
    campaigns: number;
    activeCampaigns: number;
    messages: number;
    delivered: number;
    read: number;
    failed: number;
  };
  rates: { delivery: number; read: number };
  recentCampaigns: Campaign[];
}

export interface ImportResult {
  created: number;
  skipped: number;
  errors: number;
  total: number;
}

export default api;
