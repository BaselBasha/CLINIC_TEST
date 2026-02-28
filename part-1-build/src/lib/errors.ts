/**
 * Application-wide custom error class with error codes.
 * Replaces ad-hoc `(error as any).statusCode = ...` pattern.
 */

export enum ErrorCode {
  // Auth
  DUPLICATE_EMAIL = "DUPLICATE_EMAIL",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  AUTHENTICATION_REQUIRED = "AUTHENTICATION_REQUIRED",
  INVALID_TOKEN = "INVALID_TOKEN",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",

  // Authorization
  FORBIDDEN = "FORBIDDEN",

  // Validation
  VALIDATION_ERROR = "VALIDATION_ERROR",

  // Resources
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",

  // Appointments
  APPOINTMENT_NOT_FOUND = "APPOINTMENT_NOT_FOUND",
  DOCTOR_NOT_FOUND = "DOCTOR_NOT_FOUND",
  APPOINTMENT_IN_PAST = "APPOINTMENT_IN_PAST",
  APPOINTMENT_CONFLICT = "APPOINTMENT_CONFLICT",
  PATIENT_CONFLICT = "PATIENT_CONFLICT",
  ALREADY_CANCELLED = "ALREADY_CANCELLED",
  ALREADY_COMPLETED = "ALREADY_COMPLETED",
  CANNOT_COMPLETE = "CANNOT_COMPLETE",

  // General
  INTERNAL_ERROR = "INTERNAL_ERROR",
  ROUTE_NOT_FOUND = "ROUTE_NOT_FOUND",
  RATE_LIMITED = "RATE_LIMITED",
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;

  constructor(message: string, statusCode: number, code: ErrorCode) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
