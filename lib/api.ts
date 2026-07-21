const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('erp_token') : null;

async function request(url: string, options: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(err.error || 'Erro na requisição');
  }
  return res.json();
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    me: () => request('/api/auth/me'),
  },
  dashboard: {
    get: () => request('/api/dashboard'),
  },
  companies: {
    list: () => request('/api/companies'),
  },
  clients: {
    list: (search = '') => request(`/api/clients?search=${encodeURIComponent(search)}`),
    get: (id: string) => request(`/api/clients/${id}`),
    create: (data: object) => request('/api/clients', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: object) => request(`/api/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/api/clients/${id}`, { method: 'DELETE' }),
  },
  orders: {
    list: (params: { search?: string; status?: string; company?: string } = {}) => {
      const q = new URLSearchParams(params as Record<string, string>).toString();
      return request(`/api/orders?${q}`);
    },
    get: (id: string) => request(`/api/orders/${id}`),
    create: (data: object) => request('/api/orders', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: object) => request(`/api/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/api/orders/${id}`, { method: 'DELETE' }),
    updateChecklist: (id: string, step: string, completed: boolean) =>
      request(`/api/orders/${id}/checklist`, { method: 'PUT', body: JSON.stringify({ step, completed }) }),
    addPayment: (id: string, data: object) =>
      request(`/api/orders/${id}/payment`, { method: 'POST', body: JSON.stringify(data) }),
  },
};
