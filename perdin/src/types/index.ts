export type Role = 'ADMIN' | 'PEGAWAI' | 'DIVISI_SDM';

export interface User {
  id: number;
  username: string;
  roles: Role[];
}

export interface City {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  province: string;
  island: string;
  isForeign: boolean;
}

export interface CityPayload {
  name: string;
  latitude: number;
  longitude: number;
  province: string;
  island: string;
  isForeign: boolean;
}

export type PerdinStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface PerdinRequestPayload {
  purpose: string;
  startDate: string; // ISO format YYYY-MM-DD
  endDate: string; // ISO format YYYY-MM-DD
  originCityId: number;
  destinationCityId: number;
}

export interface PerdinRequest {
  id: number;
  purpose: string;
  startDate: string;
  endDate: string;
  originCityName: string;
  destinationCityName: string;
  status: PerdinStatus;
  username: string;
  duration?: number;
  distance?: number | null;
  dailyAllowance?: number | null;
  totalAllowance?: number | null;
  currency?: string | null;
}

export interface LoginResponse {
  token: string;
  id: number;
  username: string;
  roles?: Role[];
  role?: string;
}

export interface ForgotPasswordResponse {
  message: string;
  info: string;
}
