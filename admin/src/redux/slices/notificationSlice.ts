import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

interface NotificationState {
  sending: boolean;
  error: string | null;
  success: boolean;
}

const initialState: NotificationState = { sending: false, error: null, success: false };

export const sendNotification = createAsyncThunk(
  "notifications/send",
  async (data: { title: string; message: string; type: string }, { rejectWithValue }) => {
    try {
      await api.post("/admin/notifications", data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(e.response?.data?.message || "Failed to send");
    }
  }
);

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    resetNotification: (s) => { s.success = false; s.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendNotification.pending,   (s) => { s.sending = true; s.error = null; s.success = false; })
      .addCase(sendNotification.fulfilled, (s) => { s.sending = false; s.success = true; })
      .addCase(sendNotification.rejected,  (s, a) => { s.sending = false; s.error = a.payload as string; });
  },
});

export const { resetNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
