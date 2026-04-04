import api from "./api";
import type { AuthResponse } from "../types";

export const registerUser = (data: {
  name: string;
  username: string;
  email: string;
  password: string;
}) => api.post<AuthResponse>("/auth/register", data);

export const loginUser = (data: { email: string; password: string }) =>
  api.post<AuthResponse>("/auth/login", data);

export const logoutUser = () => api.post("/auth/logout");

export const getMe = () => api.get<AuthResponse>("/auth/me");
