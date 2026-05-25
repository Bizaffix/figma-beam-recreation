import { tokenManager } from "@/lib/tokenManager";

export const getBackendAccessToken = () => tokenManager.getAccessToken();

export const getBackendAuthHeaders = (): HeadersInit => {
  const token = getBackendAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
