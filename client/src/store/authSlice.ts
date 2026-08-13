import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { IUser } from "../types";
import { getMe, loginUser, logoutUser, registerUser } from "../services/authService";

interface AuthState {
  user: IUser | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = { user: null, loading: true, error: null };

export const fetchMe = createAsyncThunk("auth/fetchMe", async () => {
  const res = await getMe();
  return res.data;
});

export const login = createAsyncThunk(
  "auth/login",
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await loginUser(credentials);
      return res.data;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(e.response?.data?.message || "Login failed");
    }
  }
);

export const register = createAsyncThunk(
  "auth/register",
  async (data: { name: string; username: string; email: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await registerUser(data);
      return res.data;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(e.response?.data?.message || "Registration failed");
    }
  }
);

export const logout = createAsyncThunk("auth/logout", async () => {
  await logoutUser();
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<IUser>) { state.user = action.payload; },
    clearError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.pending,    (s) => { s.loading = true; })
      .addCase(fetchMe.fulfilled,  (s, a) => { s.user = a.payload; s.loading = false; })
      .addCase(fetchMe.rejected,   (s) => { s.user = null; s.loading = false; })
      .addCase(login.pending,      (s) => { s.loading = true; s.error = null; })
      .addCase(login.fulfilled,    (s, a) => { s.user = a.payload; s.loading = false; })
      .addCase(login.rejected,     (s, a) => { s.loading = false; s.error = a.payload as string; })
      .addCase(register.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(register.fulfilled, (s, a) => { s.user = a.payload; s.loading = false; })
      .addCase(register.rejected,  (s, a) => { s.loading = false; s.error = a.payload as string; })
      .addCase(logout.fulfilled,   (s) => { s.user = null; });
  },
});

export const { setUser, clearError } = authSlice.actions;
export default authSlice.reducer;
