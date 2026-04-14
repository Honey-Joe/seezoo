import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { IUser } from "../types";
import {
  getMe,
  loginUser,
  logoutUser,
  registerUser,
  sendGoogleToken,
} from "../services/authService";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";

interface AuthState {
  user: IUser | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  loading: true,
  error: null,
};

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
  async (
    data: { name: string; username: string; email: string; password: string },
    { rejectWithValue }
  ) => {
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
  // Also sign out of Firebase so Google session is cleared
  await signOut(auth).catch(() => {});
});

/**
 * googleLogin — used on both Login and Register pages.
 * Returns either:
 *  - A full IUser (logged in / account created)
 *  - A special object { needsRegistration, email, name } (login page, no account)
 *  - A special object { pendingGoogle, email, name, picture } (register page, needs username)
 */
export const googleLogin = createAsyncThunk(
  "auth/googleLogin",
  async (
    payload: { idToken: string; action: "login" | "register" },
    { rejectWithValue }
  ) => {
    try {
      const res = await sendGoogleToken(payload.idToken, payload.action);
      return res.data;
    } catch (err: unknown) {
      const e = err as {
        response?: { data?: { message?: string; needsRegistration?: boolean } };
      };
      // 404 with needsRegistration is expected on login — surface it
      if (e.response?.data?.needsRegistration) {
        return rejectWithValue({ needsRegistration: true, ...e.response.data });
      }
      return rejectWithValue(e.response?.data?.message || "Google sign-in failed");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<IUser>) {
      state.user = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchMe
      .addCase(fetchMe.pending, (state) => { state.loading = true; })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.user = null;
        state.loading = false;
      })
      // login
      .addCase(login.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // register — server returns { verificationSent: true } NOT a user, so don't set user
      .addCase(register.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(register.fulfilled, (state) => {
        state.loading = false; // user stays null until email verified + login
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
      })
      // googleLogin — only sets user if a full account is returned
      .addCase(googleLogin.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload as Record<string, unknown>;
        // If it's a real user (has _id), store it; otherwise component handles redirect
        if (data._id) {
          state.user = action.payload as IUser;
        }
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        if (typeof payload === "object" && payload !== null && (payload as Record<string, unknown>).needsRegistration) {
          state.error = null; // component handles redirect
        } else {
          state.error = (payload as string) || "Google sign-in failed";
        }
      });
  },
});

export const { setUser, clearError } = authSlice.actions;
export default authSlice.reducer;
