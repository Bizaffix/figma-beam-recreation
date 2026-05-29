import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { authActions } from "@/redux/auth/authSlice";
import {
  selectAccessToken,
  selectAuthError,
  selectAuthHydrated,
  selectAuthRole,
  selectAuthStatus,
  selectAuthUser,
  selectHasAiAccess,
  selectIsAuthenticated,
} from "@/redux/auth/authSelectors";

export const useReduxAuth = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectAuthUser);
  const role = useAppSelector(selectAuthRole);
  const accessToken = useAppSelector(selectAccessToken);
  const status = useAppSelector(selectAuthStatus);
  const error = useAppSelector(selectAuthError);
  const hydrated = useAppSelector(selectAuthHydrated);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const hasAiAccess = useAppSelector(selectHasAiAccess);

  return {
    user,
    role,
    accessToken,
    status,
    error,
    hydrated,
    isAuthenticated,
    hasAiAccess,
    loading: status === "loading" || !hydrated,
    clearCredentials: () => dispatch(authActions.clearCredentials()),
  };
};
