/*
 * API client for the IMW Parking backend.
 *
 * This module exports a single `apiService` object that provides the minimal
 * methods needed by the frontend (auth + dashboard data).
 *
 * The backend expects a JWT in the Authorization header for protected routes.
 * A successful login returns a token which we store in localStorage and include
 * on subsequent requests.
 */

const API_BASE = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'AGENT' | 'CLIENT';
};

type ApiResponse<T = any> = {
  data?: T;
  user?: AuthUser;
  token?: string;
  message?: string;
  role?: string;
  error?: string;
};

const getToken = () => localStorage.getItem('token');
const setToken = (token: string) => localStorage.setItem('token', token);
const removeToken = () => localStorage.removeItem('token');

async function request<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ...json,
      error:
        json?.error || json?.message || `Request failed with status ${response.status}`,
    };
  }

  return json as ApiResponse<T>;
}

export const apiService = {
  async login(email: string, password: string) {
    const response = await request<{ token: string; user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.token) {
      setToken(response.token);
    }

    return response;
  },

  async register(name: string, email: string, password: string, role: string) {
    return request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });
  },

  logout() {
    removeToken();
    // NOTE: backend does not currently provide a logout endpoint.
  },

  async getActiveVehicles() {
    return request('/api/vehicles/active');
  },

  async getAllReclamations() {
    return request('/api/reclamations');
  },

  async getAllSubscriptions() {
    return request('/api/subscriptions');
  },
};
