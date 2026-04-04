import { Navigate } from "react-router-dom";
import { useAppSelector } from "../store";
import type { ReactNode } from "react";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAppSelector((s) => s.auth);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-purple-50 gap-4">
        <div className="text-5xl animate-bounce">🐾</div>
        <p className="text-purple-600 font-semibold text-sm tracking-wide">Loading Seezoo...</p>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
