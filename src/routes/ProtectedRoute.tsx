import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "@/redux/hooks";
import {
  selectAuthHydrated,
  selectAuthRole,
  selectAuthStatus,
  selectIsAuthenticated,
} from "@/redux/auth/authSelectors";
import { RoleGuard } from "@/routes/RoleGuard";
import type { AppUserRole } from "@/types/auth.types";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: AppUserRole[];
  redirectTo?: string;
  publicOnly?: boolean;
  loadingFallback?: ReactNode;
}

const roleHomePath: Record<string, string> = {
  admin: "/admin/dashboard",
  instructor: "/instructor/dashboard",
  location_owner: "/location-owner/dashboard",
  student: "/home",
};

const DefaultLoadingFallback = () => (
  <div className="flex min-h-screen items-center justify-center">Loading...</div>
);

export const ProtectedRoute = ({
  children,
  allowedRoles,
  redirectTo = "/login",
  publicOnly = false,
  loadingFallback,
}: ProtectedRouteProps) => {
  const location = useLocation();
  const role = useAppSelector(selectAuthRole);
  const status = useAppSelector(selectAuthStatus);
  const hydrated = useAppSelector(selectAuthHydrated);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  if (!hydrated || status === "loading") {
    return <>{loadingFallback || <DefaultLoadingFallback />}</>;
  }

  if (publicOnly && isAuthenticated) {
    return <Navigate to={roleHomePath[role || "student"]} replace />;
  }

  if (!publicOnly && !isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (allowedRoles?.length) {
    return (
      <RoleGuard allowedRoles={allowedRoles} loadingFallback={loadingFallback}>
        {children}
      </RoleGuard>
    );
  }

  return <>{children}</>;
};
