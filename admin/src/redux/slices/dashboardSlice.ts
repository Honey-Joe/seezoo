import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { DashboardStats } from "../../types";
import api from "../../services/api";

interface DashboardState {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = { stats: null, loading: false, error: null };

export const fetchDashboardStats = createAsyncThunk("dashboard/fetchStats", async () => {
  const res = await api.get<DashboardStats>("/admin/dashboard");
  return res.data;
});

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(fetchDashboardStats.fulfilled, (s, a) => { s.loading = false; s.stats = a.payload; })
      .addCase(fetchDashboardStats.rejected,  (s) => { s.loading = false; s.error = "Failed to load stats"; });
  },
});

export default dashboardSlice.reducer;
