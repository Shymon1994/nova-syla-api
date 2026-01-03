export interface ClientData {
  clientId?: string;
  phone: string;
  name?: string;
  balance?: number;
  level?: string;
  email?: string;
  city?: string;
  registeredAt?: Date;
}

export interface LoginRequest {
  phone: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: ClientData;
}

export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
}
