const API_URL = process.env.NEXT_PUBLIC_API_URL

if (!API_URL) {
  throw new Error("Missing NEXT_PUBLIC_API_URL. Set it in .env.local or deployment environment variables.")
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

type AuthFailureHandler = () => Promise<string | null> | string | null

let authFailureHandler: AuthFailureHandler | null = null

export function setAuthFailureHandler(handler: AuthFailureHandler | null) {
  authFailureHandler = handler
}

function buildHeaders(token?: string, hasJsonBody = false) {
  const headers = new Headers()
  if (hasJsonBody) {
    headers.set("Content-Type", "application/json")
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }
  return headers
}

type ApiOptions = RequestInit & { token?: string; retried?: boolean }

async function parseApiError(response: Response) {
  let message = "Request failed"
  try {
    const data = await response.json()
    message = data.detail || data.error || message
  } catch {
    message = response.statusText || message
  }
  return new ApiError(message, response.status)
}

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { token, headers, body, retried, ...rest } = options

  const requestHeaders =
    headers instanceof Headers || Array.isArray(headers) || !headers
      ? headers ?? buildHeaders(token, body !== undefined)
      : new Headers(headers)

  if (requestHeaders instanceof Headers && body !== undefined && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json")
  }
  if (requestHeaders instanceof Headers && token && !requestHeaders.has("Authorization")) {
    requestHeaders.set("Authorization", `Bearer ${token}`)
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: requestHeaders,
    body,
  })

  if (response.ok) {
    if (response.status === 204) return undefined as T
    return response.json() as Promise<T>
  }

  if (response.status === 401 && token && !retried && authFailureHandler) {
    const refreshedToken = await authFailureHandler()
    if (refreshedToken) {
      return apiRequest<T>(path, { ...options, token: refreshedToken, retried: true })
    }
  }

  throw await parseApiError(response)
}

export { API_URL }
