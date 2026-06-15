/**
 * Typisierter Fetch-Client für die NestJS-API.
 * - Hängt Bearer-Access-Token an.
 * - Bei 401 genau einmal Silent-Refresh (POST /auth/refresh via HttpOnly-Cookie),
 *   dann Retry. Token wird modul-lokal gehalten (Single Source für Requests).
 */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

let _accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  _accessToken = token;
}
export function getAccessToken(): string | null {
  return _accessToken;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
  }
}

async function refreshToken(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { accessToken: string };
    setAccessToken(data.accessToken);
    return true;
  } catch {
    return false;
  }
}

export interface ApiOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** interner Retry-Marker */
  _retried?: boolean;
}

export async function apiFetch<T = unknown>(
  path: string,
  opts: ApiOptions = {},
): Promise<T> {
  const headers = new Headers(opts.headers);
  if (_accessToken) headers.set("Authorization", `Bearer ${_accessToken}`);

  const isFormData =
    typeof FormData !== "undefined" && opts.body instanceof FormData;
  let body: BodyInit | undefined;
  if (opts.body !== undefined) {
    if (isFormData) body = opts.body as FormData;
    else {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(opts.body);
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers,
    body,
    credentials: "include",
  });

  if (res.status === 401 && !opts._retried) {
    const ok = await refreshToken();
    if (ok) return apiFetch<T>(path, { ...opts, _retried: true });
  }

  if (!res.ok) {
    let errBody: unknown;
    try {
      errBody = await res.json();
    } catch {
      errBody = await res.text().catch(() => undefined);
    }
    throw new ApiError(res.status, `API ${res.status} ${path}`, errBody);
  }

  if (res.status === 204) return undefined as T;
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) return (await res.json()) as T;
  return (await res.text()) as unknown as T;
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "PATCH", body }),
  del: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
  upload: <T>(path: string, form: FormData) =>
    apiFetch<T>(path, { method: "POST", body: form }),
};
