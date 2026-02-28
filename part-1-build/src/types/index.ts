import { Role } from "@prisma/client";

// JWT payload embedded in tokens
export interface JwtPayload {
  id: string;
  email: string;
  role: Role;
}

// Extend Express Request to carry authenticated user info
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// Consistent API response envelope
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// User data returned in responses (never includes password)
export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: Role;
}

// Token pair returned by login and refresh
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Appointment response with nested user info
export interface AppointmentResponse {
  id: string;
  patientId: string;
  doctorId: string;
  dateTime: Date;
  duration: number;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  patient?: UserResponse;
  doctor?: UserResponse;
}
