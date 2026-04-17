import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { Report, PaginatedResponse } from "../../types";
import api from "../../services/api";

interface ReportState {
  reports: Report[];
  total: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
}

const initialState: ReportState = { reports: [], total: 0, totalPages: 1, loading: false, error: null };

export const fetchReports = createAsyncThunk(
  "reports/fetchAll",
  async (params: { page?: number; status?: string }) => {
    const res = await api.get<PaginatedResponse<Report>>("/admin/reports", { params });
    return res.data;
  }
);

export const resolveReport = createAsyncThunk("reports/resolve", async (reportId: string) => {
  await api.patch(`/admin/reports/${reportId}/resolve`);
  return reportId;
});

export const ignoreReport = createAsyncThunk("reports/ignore", async (reportId: string) => {
  await api.patch(`/admin/reports/${reportId}/ignore`);
  return reportId;
});

export const deleteReportedPost = createAsyncThunk(
  "reports/deletePost",
  async ({ reportId, postId }: { reportId: string; postId: string }) => {
    await api.delete(`/admin/posts/${postId}`);
    await api.patch(`/admin/reports/${reportId}/resolve`);
    return reportId;
  }
);

const reportSlice = createSlice({
  name: "reports",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReports.pending,          (s) => { s.loading = true; s.error = null; })
      .addCase(fetchReports.fulfilled,        (s, a) => {
        s.loading = false;
        s.reports = a.payload.data;
        s.total = a.payload.total;
        s.totalPages = a.payload.totalPages;
      })
      .addCase(fetchReports.rejected,         (s) => { s.loading = false; s.error = "Failed to fetch reports"; })
      .addCase(resolveReport.fulfilled,       (s, a) => {
        const r = s.reports.find((r) => r._id === a.payload);
        if (r) r.status = "resolved";
      })
      .addCase(ignoreReport.fulfilled,        (s, a) => {
        const r = s.reports.find((r) => r._id === a.payload);
        if (r) r.status = "ignored";
      })
      .addCase(deleteReportedPost.fulfilled,  (s, a) => {
        s.reports = s.reports.filter((r) => r._id !== a.payload);
      });
  },
});

export default reportSlice.reducer;
