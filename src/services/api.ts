/*
 * API client for the IMW Parking backend.
 *
 * ✅ AMÉLIORÉ v2:
 * - Support access_token + refresh_token (JWT 2 tokens)
 * - Refresh automatique si le token expire (401)
 * - Nouveaux endpoints : payments, spaces, stats, vehicles
 */

const API_BASE = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'AGENT' | 'CLIENT';
  phone?: string;
};

type ApiResponse<T = any> = {
  data?: T;
  user?: AuthUser;
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  token?: string;
  message?: string;
  role?: string;
  error?: string;
  details?: any;
  page?: number;
  per_page?: number;
  total?: number;
};

const getAccessToken  = () => localStorage.getItem('access_token');
const getRefreshToken = () => localStorage.getItem('refresh_token');

const setTokens = (access: string, refresh: string) => {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
};

const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('token');
};

let isRefreshing = false;

async function request<T = any>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const token = getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && retry && !isRefreshing) {
    isRefreshing = true;
    const refreshed = await tryRefreshToken();
    isRefreshing = false;

    if (refreshed) {
      return request<T>(path, options, false);
    } else {
      clearTokens();
      window.location.href = '/login';
      return { error: 'Session expirée, veuillez vous reconnecter' };
    }
  }

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ...json,
      error: json?.error || json?.message || `Erreur ${response.status}`,
    };
  }

  return json as ApiResponse<T>;
}

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export const apiService = {

  // ── Auth ──────────────────────────────────────────────────────

  async login(email: string, password: string) {
    const response = await request<{ access_token: string; refresh_token: string; user: AuthUser }>(
      '/api/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    );

    if (response.access_token && response.refresh_token) {
      setTokens(response.access_token, response.refresh_token);
    }
    if (response.token && !response.access_token) {
      localStorage.setItem('access_token', response.token);
    }

    return response;
  },

  async register(name: string, email: string, password: string, role: string) {
    return request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });
  },

  async logout() {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      await request('/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      }).catch(() => {});
    }
    clearTokens();
  },

  async getMe() {
    return request<AuthUser>('/api/auth/me');
  },

  // ── Utilisateurs ──────────────────────────────────────────────

  async getAllUsers(page = 1, perPage = 20) {
    return request(`/api/users/?page=${page}&per_page=${perPage}`);
  },

  async getUser(id: number) {
    return request(`/api/users/${id}`);
  },

  async updateUser(id: number, data: Partial<AuthUser>) {
    return request(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteUser(id: number) {
    return request(`/api/users/${id}`, { method: 'DELETE' });
  },

  // ── Véhicules ────────────────────────────────────────────────

  async getAllVehicles(page = 1, perPage = 20) {
    return request(`/api/vehicles/?page=${page}&per_page=${perPage}`);
  },

  async getActiveVehicles() {
    return request('/api/vehicles/active');
  },

  async getCapacity() {
    return request('/api/vehicles/capacity');
  },

  async createVehicle(data: {
    license_plate: string;
    vehicle_type?: string;
    brand?: string;
    color?: string;
    user_id?: number;
  }) {
    return request('/api/vehicles/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async vehicleEntry(data: {
    license_plate: string;
    vehicle_type?: string;
    spot_number?: string;
  }) {
    return request('/api/vehicles/entry', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async vehicleExit(data: {
    license_plate: string;
    payment_method?: 'CASH' | 'CARD' | 'ONLINE';
  }) {
    return request('/api/vehicles/exit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getVehicleHistory(plate: string, page = 1) {
    return request(`/api/vehicles/${plate}/history?page=${page}`);
  },

  async deleteVehicle(id: number) {
    return request(`/api/vehicles/${id}`, { method: 'DELETE' });
  },

  // ── Places de parking ────────────────────────────────────────

  async getAllSpaces() {
    return request('/api/spaces/');
  },

  async getAvailableSpaces(vehicleType?: string) {
    const q = vehicleType ? `?type=${vehicleType}` : '';
    return request(`/api/spaces/available${q}`);
  },

  async createSpace(data: { spot_number: string; space_type?: string; floor?: number }) {
    return request('/api/spaces/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateSpace(spotNumber: string, data: { is_available?: boolean; is_reserved?: boolean }) {
    return request(`/api/spaces/${spotNumber}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // ── Abonnements ──────────────────────────────────────────────

  async getAllSubscriptions(page = 1, perPage = 20) {
    return request(`/api/subscriptions/?page=${page}&per_page=${perPage}`);
  },

  async getMySubscriptions() {
    return request('/api/subscriptions/user');
  },

  async getSubscription(id: number) {
    return request(`/api/subscriptions/${id}`);
  },

  async createSubscription(data: {
    license_plate: string;
    plan_type: 'HOURLY' | 'DAILY' | 'MONTHLY' | 'ANNUAL';
    start_date: string;
    end_date: string;
    vehicle_id?: number;
    notes?: string;
  }) {
    return request('/api/subscriptions/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateSubscriptionStatus(id: number, status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED') {
    return request(`/api/subscriptions/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // ── Réclamations ─────────────────────────────────────────────

  async getAllReclamations(page = 1, perPage = 20) {
    return request(`/api/reclamations/?page=${page}&per_page=${perPage}`);
  },

  async getMyReclamations() {
    return request('/api/reclamations/my-reclamations');
  },

  async createReclamation(data: { subject: string; description: string }) {
    return request('/api/reclamations/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateReclamationStatus(id: number, status: string) {
    return request(`/api/reclamations/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // ── Paiements ────────────────────────────────────────────────

  async getAllPayments(page = 1, perPage = 20) {
    return request(`/api/payments/?page=${page}&per_page=${perPage}`);
  },

  async getPaymentSummary() {
    return request('/api/payments/summary');
  },

  // ── Statistiques ─────────────────────────────────────────────

  async getTodayStats() {
    return request('/api/stats/today');
  },

  async getMonthlyStats(year?: number, month?: number) {
    const q = year && month ? `?year=${year}&month=${month}` : '';
    return request(`/api/stats/monthly${q}`);
  },

  async getOverview() {
    return request('/api/stats/overview');
  },

  getExportCsvUrl() {
    const token = getAccessToken();
    return `${API_BASE}/api/stats/export/csv?token=${token}`;
  },

  // ── Utilitaires ──────────────────────────────────────────────

  isAuthenticated() {
    return !!getAccessToken();
  },
};