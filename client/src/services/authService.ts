import api from "./api";
import type { AuthResponse } from "../types";

export const registerUser  = (data: { name: string; username: string; email: string; password: string }) =>
  api.post<AuthResponse>("/auth/register", data);

export const loginUser     = (data: { email: string; password: string }) =>
  api.post<AuthResponse>("/auth/login", data);

export const logoutUser    = () => api.post("/auth/logout");

export const getMe         = () => api.get<AuthResponse>("/auth/me");

export const changePasswordOnServer = (currentPassword: string | undefined, newPassword: string) =>
  api.patch<{ message: string }>("/auth/change-password", { currentPassword, newPassword });

export const forgotPassword = (email: string) =>
  api.post<{ message: string }>("/auth/forgot-password", { email });

export const resetPassword  = (token: string, newPassword: string) =>
  api.post<{ message: string }>("/auth/reset-password", { token, newPassword });
