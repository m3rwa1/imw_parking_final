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
  license_plate?: string;
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
  expected_end_time: string | null;
  spot_number: string | null;
  vehicle_type: 'Voiture' | 'Moto' | 'Camion';
  status: 'IN' | 'OUT';
  origin_type?: 'entry' | 'reservation';
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
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING';
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

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  } catch (err: any) {
    // Network / CORS / DNS errors
    return { error: `Erreur réseau: ${err?.message || 'connexion impossible'}` } as any;
  }

  // ✅ Refresh automatique seulement sur les routes protégées
  if (response.status === 401 && !isPublic) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${getAccessToken()}`;
      try {
        response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
      } catch (err: any) {
        return { error: `Erreur réseau: ${err?.message || 'connexion impossible'}` } as any;
      }
    } else {
      clearTokens();
      window.dispatchEvent(new Event('auth:logout'));
      return { error: 'Session expirée, veuillez vous reconnecter' } as any;
    }
  }

  let json: any = {};
  try { json = await response.json(); } catch { /* réponse vide */ }

  if (!response.ok) {
    return { ...json, error: json?.error || json?.message || `Erreur ${response.status}` } as any;
  }
  return json as any;
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

  async register(name: string, email: string, password: string, role = 'CLIENT', license_plate?: string) {
    return request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, license_plate }),
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

  async updateUser(id: number, data: { name?: string; email?: string; role?: string; license_plate?: string }) {
    return request(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteUser(id: number) {
    return request(`/api/users/${id}`, { method: 'DELETE' });
  },

  async clearAllUsers() {
    return request('/api/users/clear-all', { method: 'DELETE' });
  },

  async clearAllReservations() {
    return request('/api/reservations/clear-all', { method: 'DELETE' });
  },

  async clearAllReclamations() {
    return request('/api/reclamations/clear-all', { method: 'DELETE' });
  },

  async clearAllLogs() {
    return request('/api/logs/clear-all', { method: 'DELETE' });
  },

  // ── VÉHICULES ───────────────────────────────────────────────

  async getActiveVehicles() {
    return request<{ data: DBParkingEntry[] }>('/api/vehicles/active');
  },

  async getOccupiedSpots() {
    return request<string[]>('/api/vehicles/occupied-spots');
  },

  async getCapacity() {
    return request<{ occupied: number; total: number }>('/api/vehicles/capacity');
  },

  async vehicleEntry(data: {
    license_plate: string;
    vehicle_type?: 'Voiture' | 'Moto' | 'Camion';
    spot_number?: string;
    expected_end_time?: string;
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

  async updateVehicleEntry(id: number, data: { 
    license_plate: string; 
    vehicle_type?: string; 
    spot_number?: string;
    expected_end_time?: string | null; 
  }) {
    return request(`/api/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async getVehicleHistory(plate: string) {
    return request<{ data: DBParkingEntry[] }>(`/api/vehicles/${plate}/history`);
  },

  // ── ABONNEMENTS ─────────────────────────────────────────────

  async getAllSubscriptions(page = 1, perPage = 20) {
    return request<{ data: DBSubscription[]; total: number }>(
      `/api/subscriptions/?page=${page}&per_page=${perPage}`
    );
  },

  async getMySubscriptions() {
    return request<{ data: DBSubscription[] }>('/api/subscriptions/user');
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

  async deleteSubscription(id: number) {
    return request(`/api/subscriptions/${id}`, { method: 'DELETE' });
  },

  async updateSubscriptionStatus(id: number, status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED') {
    return request(`/api/subscriptions/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // ── RESERVATIONS ────────────────────────────────────────────

  async createReservation(data: {
    proche_id: number;
    place_number: string;
    nom_proche?: string;
    license_plate: string;
    vehicle_type: string;
    start_time: string;
    end_time: string;
    montant: number;
    payment_method?: string;
  }) {
    return request('/api/reservations/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getAdminReservations(page: number = 1, perPage: number = 5) {
    return request<{ data: any[]; total: number }>(`/api/reservations/admin?page=${page}&per_page=${perPage}`);
  },

  async deleteReservation(id: number) {
    return request(`/api/reservations/${id}`, { method: 'DELETE' });
  },

  async validateReservation(id: number, spot_number?: string) {
    return request(`/api/reservations/${id}/validate`, {
      method: 'PUT',
      body: JSON.stringify({ spot_number }),
    });
  },

  // ── RÉCLAMATIONS ────────────────────────────────────────────

  async getAllReclamations(page = 1, perPage = 50) {
    return request<{ data: DBReclamation[]; total: number }>(
      `/api/reclamations/?page=${page}&per_page=${perPage}`
    );
  },

  async getMyReclamations() {
    return request<{ data: DBReclamation[] }>('/api/reclamations/my-reclamations');
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

  // ── TARIFS ──────────────────────────────────────────────────

  async getPricingPlans() {
    return request<{ data: any[] }>('/api/pricing/');
  },

  async updatePricingPlan(id: number, data: { price: number; label?: string }) {
    return request(`/api/pricing/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },


  // ── PAIEMENTS ───────────────────────────────────────────────

  async createPayment(data: {
    amount: number;
    payment_method: 'CASH' | 'CARD' | 'TRANSFER';
    subscription_id?: number;
    entry_id?: number;
  }) {
    return request('/api/payments/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // ── LOGS ────────────────────────────────────────────────────

  async getActivityLogs(page = 1, perPage = 50) {
    return request<{ data: any[]; total: number }>(
      `/api/logs/?page=${page}&per_page=${perPage}`
    );
  },

  // ── STATISTIQUES ────────────────────────────────────────────

  async getTodayStats() {
    return request<{
      total_entries?: number;
      entries_today?: number;
      total_exits?: number;
      active_now?: number;
      total_revenue?: number;
      active_subscriptions?: number;
      trends?: Record<string, string>;
    }>('/api/stats/today');
  },

  async getRevenueHistory(days = 7) {
    return request<{ date: string; revenue: number }[]>(`/api/stats/revenue-history?days=${days}`);
  },

  async getVehicleDistribution() {
    return request<{ vehicle_type: string; count: number }[]>('/api/stats/distribution');
  },

  async getOverview() {
    return request<{
      total_users: number;
      total_vehicles: number;
      active_subscriptions: number;
      open_reclamations: number;
    }>('/api/stats/overview');
  },


  // ── EXPORT EXCEL ────────────────────────────────────────────

  async downloadReport(type: 'daily' | 'weekly' | 'monthly' | 'annual') {
    const token = getAccessToken();
    const url = `${API_BASE}/api/reports/${type}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error("Erreur de téléchargement");
    }
    
    const blob = await response.blob();
    const windowUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = windowUrl;
    a.download = `rapport_${type}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },

  // ── UTILITAIRES ─────────────────────────────────────────────
  isAuthenticated() {
    return !!getAccessToken();
  },
};