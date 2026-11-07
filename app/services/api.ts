import type { FetchOptions } from 'ofetch'

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

interface SuccessEnvelope<T> {
  success: true
  data: T
  meta?: PaginationMeta
}

interface ErrorEnvelope {
  success: false
  error: { code: string, message: string, details?: unknown }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

type RequestOptions = Omit<FetchOptions, 'baseURL' | 'method' | 'body'> & {
  body?: Record<string, unknown>
}

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

async function request<T>(method: HttpMethod, path: string, options: RequestOptions = {}): Promise<SuccessEnvelope<T>> {
  const config = useRuntimeConfig()
  // During SSR the browser's session cookie must be forwarded by hand.
  const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined

  try {
    // Nuxt's typed $fetch narrows `method` per known route; our paths are dynamic.
    const untypedFetch = $fetch as (url: string, opts: FetchOptions) => Promise<unknown>
    const res = await untypedFetch(`/api${path}`, {
      ...options,
      method,
      baseURL: import.meta.server ? config.apiInternalBase : config.public.apiBase,
      credentials: 'include',
      headers: { ...headers, ...options.headers }
    }) as SuccessEnvelope<T> | undefined
    // 204 responses (e.g. logout, delete) have no body
    return res ?? { success: true, data: undefined as T }
  } catch (err) {
    const res = (err as { response?: { status: number, _data?: ErrorEnvelope } }).response
    const apiError = res?._data?.error
    if (apiError) {
      if (res!.status === 401 && import.meta.client && !path.startsWith('/auth/')) {
        // Imported lazily: the session store imports this module
        const { useSessionStore } = await import('~/stores/session')
        await useSessionStore().expireSession()
      }
      throw new ApiError(res!.status, apiError.code, apiError.message, apiError.details)
    }
    throw new ApiError(res?.status ?? 0, 'NETWORK_ERROR', 'Unable to reach the server')
  }
}

export const api = {
  async get<T>(path: string, query?: Record<string, unknown>): Promise<T> {
    return (await request<T>('GET', path, { query })).data
  },

  /** For list endpoints: returns the rows plus pagination meta. */
  async list<T>(path: string, query?: Record<string, unknown>): Promise<{ data: T[], meta: PaginationMeta }> {
    const res = await request<T[]>('GET', path, { query })
    return { data: res.data, meta: res.meta! }
  },

  async post<T>(path: string, body?: Record<string, unknown>): Promise<T> {
    return (await request<T>('POST', path, { body })).data
  },

  async patch<T>(path: string, body?: Record<string, unknown>): Promise<T> {
    return (await request<T>('PATCH', path, { body })).data
  },

  async delete(path: string): Promise<void> {
    await request<unknown>('DELETE', path)
  }
}
