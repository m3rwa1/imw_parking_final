export type UserRole = 'ADMIN' | 'MANAGER' | 'AGENT' | 'CLIENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Vehicle {
  id: string;
  licensePlate: string;
  type: 'Voiture' | 'Moto' | 'Camion';
  entryTime: string;
  exitTime?: string;
  status: 'IN' | 'OUT';
  spotNumber?: string;
  price?: number;
}

export interface Subscription {
  id: string;
  userId: string;
  vehiclePlate: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED';
}

export interface ParkingStats {
  totalVehiclesToday: number;
  currentOccupancy: number;
  dailyRevenue: number;
  monthlyRevenue: number;
}