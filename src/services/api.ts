// ============================================================
// src/services/api.ts
// Synchronisé avec imw-parking_database (exporté le 14/03/2026)
// ============================================================

const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ||
  'http://localhost:5000';

// ✅ Routes publiques — pas de token JWT envoyé
const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
];

// ── Token helpers ─────────────────────────────────────────────

function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

function getRefreshToken(): string | null {
  return localStorage.getItem('refresh_token');
}

function setTokens(access: string, refresh: string) {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
}

function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
}

// ── Types alignés sur la BD ───────────────────────────────────

export interface DBUser {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'AGENT' | 'CLIENT';
  is_active: boolean;
  created_at: string;
  plate?: string;
}

export interface DBVehicle {
  id: number;
  license_plate: string;
  vehicle_type: 'Voiture' | 'Moto' | 'Camion';
  user_id: number | null;
  is_active: boolean;
  created_at: string;
}

export interface DBParkingEntry {
  id: number;
  license_plate: string;
  vehicle_id: number | null;
  agent_id: number | null;
  entry_time: string;
  exit_time: string | null;
  spot_number: string | null;
  vehicle_type: 'Voiture' | 'Moto' | 'Camion';
  status: 'IN' | 'OUT';
  created_at: string;
}

export interface DBSubscription {
  id: number;
  user_id: number;
  vehicle_id: number | null;
  license_plate: string;
  plan_type: 'HOURLY' | 'DAILY' | 'MONTHLY' | 'ANNUAL';
  start_date: string;
  end_date: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  created_at: string;
  user_name?: string;
  user_email?: string;
}

export interface DBReclamation {
  id: number;
  user_id: number;
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  resolved_by: number | null;
  created_at: string;
  user_name?: string;
}

// ── Refresh token ─────────────────────────────────────────────

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

// ── Requête générique ─────────────────────────────────────────

async function request<T extends any = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T & { error?: string }> {
  const token = getAccessToken();

  // ✅ Vérifier si la route est publique
  const isPublic = PUBLIC_ROUTES.some(r => endpoint.startsWith(r));

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // ✅ N'envoyer le token QUE sur les routes protégées
  if (token && !isPublic) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  // ✅ Refresh automatique seulement sur les routes protégées
  if (response.status === 401 && !isPublic) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${getAccessToken()}`;
      response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    }
  }

  let json: any = {};
  try { json = await response.json(); } catch { /* réponse vide */ }

  if (!response.ok) {
    return { ...json, error: json?.error || json?.message || `Erreur ${response.status}` };
  }
  return json as T;
}

// ── Service API ───────────────────────────────────────────────

export const apiService = {

  // ── AUTH ────────────────────────────────────────────────────

  async login(email: string, password: string) {
    const res = await request<{
      access_token: string;
      refresh_token: string;
      user: DBUser;
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.access_token && res.refresh_token) {
      setTokens(res.access_token, res.refresh_token);
    }
    return res;
  },

  async register(name: string, email: string, password: string, role = 'CLIENT', plate?: string) {
    return request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role, plate }),
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
    return request<DBUser>('/api/auth/me');
  },

  // ── UTILISATEURS ────────────────────────────────────────────

  async getAllUsers(page = 1, perPage = 20) {
    return request<{ data: DBUser[]; total: number }>(
      `/api/users/?page=${page}&per_page=${perPage}`
    );
  },

  async getUser(id: number) {
    return request<DBUser>(`/api/users/${id}`);
  },

  async updateUser(id: number, data: { name?: string; email?: string; role?: string }) {
    return request(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteUser(id: number) {
    return request(`/api/users/${id}`, { method: 'DELETE' });
  },

  // ── VÉHICULES ───────────────────────────────────────────────

  async getActiveVehicles() {
    return request<{ data: DBParkingEntry[] }>('/api/vehicles/active');
  },

  async getCapacity() {
    return request<{ occupied: number; total: number }>('/api/vehicles/capacity');
  },

  async vehicleEntry(data: {
    license_plate: string;
    vehicle_type?: 'Voiture' | 'Moto' | 'Camion';
    spot_number?: string;
  }) {
    return request('/api/vehicles/entry', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async vehicleExit(data: { license_plate: string }) {
    return request('/api/vehicles/exit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteVehicle(id: number) {
    return request(`/api/vehicles/${id}`, { method: 'DELETE' });
  },

  async getVehicleHistory(plate: string) {
    return request<DBParkingEntry[]>(`/api/vehicles/${plate}/history`);
  },

  // ── ABONNEMENTS ─────────────────────────────────────────────

  async getAllSubscriptions(page = 1, perPage = 20) {
    return request<{ data: DBSubscription[]; total: number }>(
      `/api/subscriptions/?page=${page}&per_page=${perPage}`
    );
  },

  async getMySubscriptions() {
    return request<DBSubscription[]>('/api/subscriptions/user');
  },

  async createSubscription(data: {
    license_plate: string;
    plan_type: 'HOURLY' | 'DAILY' | 'MONTHLY' | 'ANNUAL';
    start_date: string;
    end_date: string;
    vehicle_id?: number;
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

  // ── RÉCLAMATIONS ────────────────────────────────────────────

  async getAllReclamations(page = 1, perPage = 50) {
    return request<{ data: DBReclamation[]; total: number }>(
      `/api/reclamations/?page=${page}&per_page=${perPage}`
    );
  },

  async getMyReclamations() {
    return request<DBReclamation[]>('/api/reclamations/my-reclamations');
  },

  async createReclamation(data: { subject: string; description: string }) {
    return request('/api/reclamations/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateReclamationStatus(id: number, status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED') {
    return request(`/api/reclamations/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // ── STATISTIQUES ────────────────────────────────────────────

  async getTodayStats() {
    return request<{
      total_entries: number;
      total_exits: number;
      active_now: number;
      total_revenue: number;
    }>('/api/stats/today');
  },

  async getOverview() {
    return request<{
      total_users: number;
      total_vehicles: number;
      active_subscriptions: number;
      open_reclamations: number;
    }>('/api/stats/overview');
  },

  // ── UTILITAIRES ─────────────────────────────────────────────
  isAuthenticated() {
    return !!getAccessToken();
  },
};