import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { User, PaginatedResponse } from "../../types";
import api from "../../services/api";

interface UserState {
  users: User[];
  total: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = { users: [], total: 0, totalPages: 1, loading: false, error: null };

export const fetchUsers = createAsyncThunk(
  "users/fetchAll",
  async (params: { page?: number; search?: string; status?: string }) => {
    const res = await api.get<PaginatedResponse<User>>("/admin/users", { params });
    return res.data;
  }
);

export const blockUser = createAsyncThunk("users/block", async (userId: string) => {
  await api.patch(`/admin/users/${userId}/block`);
  return userId;
});

export const unblockUser = createAsyncThunk("users/unblock", async (userId: string) => {
  await api.patch(`/admin/users/${userId}/unblock`);
  return userId;
});

export const deleteUser = createAsyncThunk("users/delete", async (userId: string) => {
  await api.delete(`/admin/users/${userId}`);
  return userId;
});

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending,    (s) => { s.loading = true; s.error = null; })
      .addCase(fetchUsers.fulfilled,  (s, a) => {
        s.loading = false;
        s.users = a.payload.data;
        s.total = a.payload.total;
        s.totalPages = a.payload.totalPages;
      })
      .addCase(fetchUsers.rejected,   (s) => { s.loading = false; s.error = "Failed to fetch users"; })
      .addCase(blockUser.fulfilled,   (s, a) => {
        const u = s.users.find((u) => u._id === a.payload);
        if (u) u.isBlocked = true;
      })
      .addCase(unblockUser.fulfilled, (s, a) => {
        const u = s.users.find((u) => u._id === a.payload);
        if (u) u.isBlocked = false;
      })
      .addCase(deleteUser.fulfilled,  (s, a) => {
        s.users = s.users.filter((u) => u._id !== a.payload);
      });
  },
});

export default userSlice.reducer;
