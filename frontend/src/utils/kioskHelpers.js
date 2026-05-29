import axios from 'axios';

// Treat price of 1 as 0 (complimentary item indicator)
export const normalizePrice = (price) => {
  return price === 1 ? 0 : price;
};

/**
 * Reject any /api/* response whose Content-Type is not JSON.
 * This is the single architectural defense that catches the entire class of
 * "nginx serves index.html for /api/*" bugs in milliseconds with a clean
 * error rather than poisoning React state with an HTML string.
 *
 * Closes audit findings: FE-5, FE-6 (no axios JSON-only guard).
 * Empty bodies (204) are allowed through; only non-JSON bodies with a
 * non-application/json content-type are rejected.
 */
const enforceJsonForApi = (response) => {
  try {
    const url = response.config?.url || '';
    // Only police /api/* — third-party assets (fonts, images) are fine as-is.
    if (!url.includes('/api/')) return response;

    const ct = (response.headers?.['content-type'] || '').toLowerCase();
    if (!ct) return response; // no header — let it through, downstream may handle

    if (ct.includes('application/json')) return response;

    // Any body with a non-JSON content-type for an /api/* call is rejected.
    const err = new Error(
      `Non-JSON response from ${url} (content-type: ${ct || 'unknown'})`
    );
    err.isNonJsonApiResponse = true;
    err.response = response;
    return Promise.reject(err);
  } catch {
    return response;
  }
};

/**
 * Create an axios instance authenticated with a Bearer token AND guarded by
 * the JSON-only response interceptor for /api/*.
 */
export const createAuthAxios = (token) => {
  const instance = axios.create();
  instance.interceptors.request.use((config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  instance.interceptors.response.use(enforceJsonForApi);
  return instance;
};

/**
 * Shared unauthenticated axios instance — same JSON guard for /api/* calls
 * made before the user has a token (e.g. login, branding).
 */
export const publicAxios = axios.create();
publicAxios.interceptors.response.use(enforceJsonForApi);
