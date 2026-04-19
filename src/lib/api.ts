function getApiBaseUrl(): string {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL as string;
  if (typeof window !== "undefined") {
    if (import.meta.env.DEV) {
      return `${window.location.protocol}//${window.location.hostname}:4000`;
    }
    return window.location.origin;
  }
  return "http://localhost:4000";
}

export const API_BASE_URL = getApiBaseUrl();
