// User roles enum
export enum UserRole {
  ADMIN = 'ADMIN',
  PELATIH = 'PELATIH',
  ATLET = 'ATLET',
}

// User status enum
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

// Base user interface
export interface BaseUser {
  id: string;
  username: string;
  email: string;
  phone?: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

// Admin user interface
export interface AdminUser extends BaseUser {
  role: UserRole.ADMIN;
  permissions: AdminPermission[];
  department?: string;
  level: AdminLevel;
}

// Pelatih (Coach) user interface
export interface PelatihUser extends BaseUser {
  role: UserRole.PELATIH;
  dojangId?: string;
  certificationNumber?: string;
  certificationLevel: string;
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  specializations: string[];
}

// Atlet (Athlete) user interface  
export interface AtletUser extends BaseUser {
  role: UserRole.ATLET;
  dojangId?: string;
  pelatihId?: string;
  birthDate: Date;
  gender: Gender;
  weight: number;
  height: number;
  bloodType?: string;
  emergencyContact: EmergencyContact;
  medicalInfo?: MedicalInfo;
  achievements: Achievement[];
  kup: KupLevel;
  dan?: DanLevel;
}

// Gender enum
export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

// Admin levels
export enum AdminLevel {
  SUPER_ADMIN = 'SUPER_ADMIN',
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  COMPETITION_ADMIN = 'COMPETITION_ADMIN',
}

// Admin permissions
export enum AdminPermission {
  MANAGE_USERS = 'MANAGE_USERS',
  MANAGE_COMPETITIONS = 'MANAGE_COMPETITIONS',
  MANAGE_DOJANG = 'MANAGE_DOJANG',
  VIEW_AUDIT_LOGS = 'VIEW_AUDIT_LOGS',
  SYSTEM_SETTINGS = 'SYSTEM_SETTINGS',
  APPROVE_REGISTRATIONS = 'APPROVE_REGISTRATIONS',
  MANAGE_VENUES = 'MANAGE_VENUES',
}

// Kup (color belt) levels
export enum KupLevel {
  KUP_10 = 'KUP_10', // White belt
  KUP_9 = 'KUP_9',   // White belt yellow stripe
  KUP_8 = 'KUP_8',   // Yellow belt
  KUP_7 = 'KUP_7',   // Yellow belt green stripe
  KUP_6 = 'KUP_6',   // Green belt
  KUP_5 = 'KUP_5',   // Green belt blue stripe
  KUP_4 = 'KUP_4',   // Blue belt
  KUP_3 = 'KUP_3',   // Blue belt red stripe
  KUP_2 = 'KUP_2',   // Red belt
  KUP_1 = 'KUP_1',   // Red belt black stripe
}

// Dan (black belt) levels
export enum DanLevel {
  DAN_1 = 'DAN_1',
  DAN_2 = 'DAN_2',
  DAN_3 = 'DAN_3',
  DAN_4 = 'DAN_4',
  DAN_5 = 'DAN_5',
  DAN_6 = 'DAN_6',
  DAN_7 = 'DAN_7',
  DAN_8 = 'DAN_8',
  DAN_9 = 'DAN_9',
}

// Emergency contact info
export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  address?: string;
}

// Medical information
export interface MedicalInfo {
  allergies?: string[];
  medications?: string[];
  conditions?: string[];
  notes?: string;
  lastCheckupDate?: Date;
}

// Achievement interface
export interface Achievement {
  id: string;
  title: string;
  description: string;
  competitionName: string;
  position: number;
  date: Date;
  certificateUrl?: string;
}

// Authentication request/response types
export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: PublicUser;
  tokens: TokenPair;
  permissions: string[];
  expiresAt: Date;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  // Additional fields based on role
  additionalData?: any;
}

export interface RegisterResponse {
  user: PublicUser;
  message: string;
  requiresVerification: boolean;
}

// Token interfaces
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string; // user id
  username: string;
  email: string;
  role: UserRole;
  permissions: string[];
  iat: number;
  exp: number;
  jti: string; // token id
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
  tokenFamily: string;
  iat: number;
  exp: number;
}

// Public user interface (without sensitive data)
export interface PublicUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  isEmailVerified: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
}

// Password change request
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Password reset request
export interface ResetPasswordRequest {
  email: string;
}

export interface ResetPasswordConfirmRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

// Profile update request
export interface UpdateProfileRequest {
  fullName?: string;
  phone?: string;
  // Additional fields based on role
  additionalData?: any;
}

// Session information
export interface SessionInfo {
  id: string;
  userId: string;
  device: string;
  ip: string;
  userAgent: string;
  createdAt: Date;
  lastActiveAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

// Authentication middleware types
export interface AuthenticatedRequest extends Request {
  user: PublicUser;
  token: string;
  sessionId: string;
}

export interface AuthContext {
  user: PublicUser;
  permissions: string[];
  sessionId: string;
}