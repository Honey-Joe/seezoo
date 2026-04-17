import { Navigate } from "react-router-dom";
import { useAppSelector } from "../../redux/store";
import type { ReactNode } from "react";

const PrivateRoute = ({ children }: { children: ReactNode }) => {
  const { admin, initialized } = useAppSelector((s) => s.auth);

  if (!initialized) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    </div>
  );

  return admin ? <>{children}</> : <Navigate to="/admin/login" replace />;
};

export default PrivateRoute;
