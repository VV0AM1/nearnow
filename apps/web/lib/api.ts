import { API_URL } from "./config";
import { getToken } from "./auth";

/** fetch() against the API with the stored bearer token and JSON handling. */
export async function apiFetch<T = unknown>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
    const { json, headers, ...rest } = init;
    const token = getToken();
    const res = await fetch(`${API_URL}${path}`, {
        ...rest,
        headers: {
            ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...headers,
        },
        body: json !== undefined ? JSON.stringify(json) : rest.body,
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
        const msg = body?.message;
        throw new Error(Array.isArray(msg) ? msg.join("\n") : msg || `Request failed (${res.status})`);
    }
    return body as T;
}

/** Absolute URL for an uploaded file path such as "/uploads/abc.jpg". */
export function mediaUrl(path?: string | null): string | null {
    if (!path) return null;
    if (/^https?:\/\//.test(path)) return path;
    return `${API_URL}/${path.replace(/^\//, "")}`;
}
