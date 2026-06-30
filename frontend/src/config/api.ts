/**
 * Returns the correct API URL based on the current environment.
 * In local dev (port 3000), it routes directly to http://localhost:4000.
 * In production (ports 80/443), it routes relatively through the Nginx proxy (/api).
 */
export const getApiUrl = (path: string): string => {
  if (typeof window !== "undefined") {
    const isProd = window.location.port === "" || window.location.port === "80" || window.location.port === "443";
    if (isProd) {
      return `/api${path}`;
    }
  }
  return `http://localhost:4000${path}`;
};

/**
 * Returns the correct Socket URL based on the current environment.
 * In local dev, it connects to http://localhost:4000.
 * In production, it connects to the same origin (Nginx proxies /socket.io/).
 */
export const getSocketUrl = (): string => {
  if (typeof window !== "undefined") {
    const isProd = window.location.port === "" || window.location.port === "80" || window.location.port === "443";
    if (isProd) {
      return window.location.origin;
    }
  }
  return "http://localhost:4000";
};
