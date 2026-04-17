import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { AdminUser } from "../../types";
import api from "../../services/api";

interface AuthState {
  admin: AdminUser | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
}

const initialState: AuthState = { admin: null, loading: false, initialized: false, error: null };

export const adminLogin = createAsyncThunk(
  "auth/adminLogin",
  async (creds: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await api.post<AdminUser>("/admin/login", creds);
      return res.data;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(e.response?.data?.message || "Login failed");
    }
  }
);

export const adminLogout = createAsyncThunk("auth/adminLogout", async () => {
  await api.post("/admin/logout");
});

export const fetchAdminMe = createAsyncThunk("auth/fetchAdminMe", async () => {
  const res = await api.get<AdminUser>("/admin/me");
  return res.data;
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(adminLogin.pending,    (s) => { s.loading = true; s.error = null; })
      .addCase(adminLogin.fulfilled,  (s, a) => { s.loading = false; s.initialized = true; s.admin = a.payload; })
      .addCase(adminLogin.rejected,   (s, a) => { s.loading = false; s.initialized = true; s.error = a.payload as string; })
      .addCase(adminLogout.fulfilled, (s) => { s.admin = null; s.initialized = true; })
      .addCase(fetchAdminMe.pending,  (s) => { s.loading = true; })
      .addCase(fetchAdminMe.fulfilled,(s, a) => { s.admin = a.payload; s.loading = false; s.initialized = true; })
      .addCase(fetchAdminMe.rejected, (s) => { s.admin = null; s.loading = false; s.initialized = true; });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
