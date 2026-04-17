import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "./redux/store";
import { fetchAdminMe } from "./redux/slices/authSlice";
import AdminLayout   from "./admin/layouts/AdminLayout";
import PrivateRoute  from "./admin/routes/PrivateRoute";
import Login         from "./admin/pages/Login";
import Dashboard     from "./admin/pages/Dashboard";
import Users         from "./admin/pages/Users";
import Posts         from "./admin/pages/Posts";
import Reports       from "./admin/pages/Reports";
import Categories    from "./admin/pages/Categories";
import Notifications from "./admin/pages/Notifications";

const AppRoutes = () => {
  const dispatch     = useAppDispatch();
  const { initialized } = useAppSelector((s) => s.auth);

  useEffect(() => {
    dispatch(fetchAdminMe());
  }, [dispatch]); // run once on mount only

  return (
    <Routes>
      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin" element={
        <PrivateRoute>
          <AdminLayout />
        </PrivateRoute>
      }>
        <Route index                element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard"     element={<Dashboard />} />
        <Route path="users"         element={<Users />} />
        <Route path="posts"         element={<Posts />} />
        <Route path="reports"       element={<Reports />} />
        <Route path="categories"    element={<Categories />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  );
};

const App = () => (
  <BrowserRouter>
    <Toaster position="top-right" toastOptions={{ style: { borderRadius: "12px", fontSize: "13px" } }} />
    <AppRoutes />
  </BrowserRouter>
);

export default App;
