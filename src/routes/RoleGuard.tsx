import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "@/redux/hooks";
import {
  selectAuthHydrated,
  selectAuthRole,
  selectAuthStatus,
  selectIsAuthenticated,
} from "@/redux/auth/authSelectors";
import { normalizeRole, type AppUserRole } from "@/types/auth.types";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: AppUserRole[];
  fallbackPath?: string;
  loadingFallback?: ReactNode;
}

const defaultRoleRedirects: Record<string, string> = {
  admin: "/admin/dashboard",
  instructor: "/instructor/dashboard",
  location_owner: "/location-owner/dashboard",
  student: "/home",
};

const DefaultLoadingFallback = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="text-center">
      <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

export const RoleGuard = ({
  children,
  allowedRoles,
  fallbackPath,
  loadingFallback,
}: RoleGuardProps) => {
  const location = useLocation();
  const role = useAppSelector(selectAuthRole);
  const status = useAppSelector(selectAuthStatus);
  const hydrated = useAppSelector(selectAuthHydrated);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  if (!hydrated || status === "loading") {
    return <>{loadingFallback || <DefaultLoadingFallback />}</>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const normalizedAllowedRoles = allowedRoles?.map(normalizeRole);
  if (normalizedAllowedRoles?.length && !normalizedAllowedRoles.includes(role)) {
    return <Navigate to={fallbackPath || defaultRoleRedirects[role || "student"]} replace />;
  }

  return <>{children}</>;
};
