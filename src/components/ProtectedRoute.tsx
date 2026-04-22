import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/types/solicitud";

interface Props {
  children: ReactNode;
  allow?: UserRole[];
}

export const ProtectedRoute = ({ children, allow }: Props) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allow && !allow.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};
