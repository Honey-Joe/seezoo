import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import authReducer       from "./slices/authSlice";
import userReducer       from "./slices/userSlice";
import postReducer       from "./slices/postSlice";
import reportReducer     from "./slices/reportSlice";
import categoryReducer   from "./slices/categorySlice";
import notificationReducer from "./slices/notificationSlice";
import dashboardReducer  from "./slices/dashboardSlice";

export const store = configureStore({
  reducer: {
    auth:          authReducer,
    users:         userReducer,
    posts:         postReducer,
    reports:       reportReducer,
    categories:    categoryReducer,
    notifications: notificationReducer,
    dashboard:     dashboardReducer,
  },
});

export type RootState   = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = <T>(selector: (s: RootState) => T) => useSelector(selector);
