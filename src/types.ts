export type UserRole = 'ADMIN' | 'MANAGER' | 'AGENT' | 'CLIENT';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface Vehicle {
  id: number;
  license_plate: string;
  type: 'Voiture' | 'Moto' | 'Camion';
  entry_time: string;
  exit_time?: string;
  status: 'IN' | 'OUT';
  spot_number?: string;
  price?: number;
}

export interface Subscription {
  id: number;
  user_id: number;
  license_plate: string;
  start_date: string;
  end_date: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
}

export interface ParkingStats {
  totalVehiclesToday: number;
  currentOccupancy: number;
  dailyRevenue: number;
  monthlyRevenue: number;
}
