const envApiUrl = (import.meta as any).env?.VITE_API_URL;
const isBrowser = typeof window !== 'undefined';
const isLocalhost = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// In cloud deployment (same domain), relative '/api/v1' automatically targets the host server
const API_BASE_URL =
  envApiUrl && (isLocalhost || !envApiUrl.includes('localhost'))
    ? envApiUrl
    : '/api/v1';

export class ApiError extends Error {
  public status: number;
  public errors?: Record<string, string>;

  constructor(message: string, status: number, errors?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

/**
 * Extracts a field-specific error message from an API error or response.
 */
export function getFieldError(error: any, field: string): string | undefined {
  if (!error) return undefined;
  if (error.errors && typeof error.errors === 'object') {
    const val = error.errors[field];
    if (typeof val === 'string') return val;
    if (Array.isArray(val) && val.length > 0) return val[0];
  }
  return undefined;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Ensures HTTP-only session cookies are sent
  });

  const contentType = response.headers.get('content-type');
  let data: any;

  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMessage =
      data?.message || data?.error || `Request failed with status ${response.status}`;

    // Normalize field-level errors to Record<string, string>
    let formattedErrors: Record<string, string> | undefined = undefined;
    if (data?.errors && typeof data.errors === 'object') {
      formattedErrors = {};
      for (const [key, val] of Object.entries(data.errors)) {
        if (typeof val === 'string') {
          formattedErrors[key] = val;
        } else if (Array.isArray(val) && val.length > 0) {
          formattedErrors[key] = String(val[0]);
        } else if (val) {
          formattedErrors[key] = String(val);
        }
      }
    }

    throw new ApiError(errorMessage, response.status, formattedErrors);
  }

  return data;
}

export const api = {
  get: <T = any>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  put: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  patch: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  delete: <T = any>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};
