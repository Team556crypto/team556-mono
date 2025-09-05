import { ApiErrorResponse } from './types'

// Ensure this matches your environment variable for the API base URL
const API_BASE_URL = process.env.EXPO_PUBLIC_GLOBAL__MAIN_API_URL || 'http://localhost:3000/api'

interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  endpoint: string
  token?: string | null
  body?: any
  params?: Record<string, string | number> // Allow numbers for query params
}

export class ApiClientError extends Error {
  status: number
  errorData: ApiErrorResponse

  constructor(message: string, status: number, errorData: ApiErrorResponse) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
    this.errorData = errorData
  }
}

export const apiClient = async <T>(options: RequestOptions): Promise<T> => {
  const { method, endpoint, token, body, params } = options

  let url = `${API_BASE_URL}${endpoint}`
  if (params) {
    // Convert all param values to string for URLSearchParams
    const stringParams: Record<string, string> = {}
    for (const key in params) {
      if (Object.prototype.hasOwnProperty.call(params, key)) {
        stringParams[key] = String(params[key])
      }
    }
    const queryParams = new URLSearchParams(stringParams)
    if (queryParams.toString()) {
      url = `${url}?${queryParams.toString()}`
    }
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    })

    if (!response.ok) {
      let errorData: ApiErrorResponse
      try {
        errorData = await response.json()
      } catch (e) {
        errorData = { error: `HTTP error! status: ${response.status} - ${response.statusText}` }
      }
      console.error('API Error:', errorData, 'Status:', response.status, 'URL:', url)
      throw new ApiClientError(
        errorData.error || `Request failed with status ${response.status}`,
        response.status,
        errorData
      )
    }

    if (response.status === 204) {
      // For 204 No Content, there is no body to parse.
      // Return an empty object or null, cast to T.
      return {} as T
    }

    return response.json() as Promise<T>
  } catch (error) {
    console.error(`API request to ${method} ${url} failed:`, error)
    if (error instanceof ApiClientError) {
      throw error
    }
    // Ensure a consistent error structure for unknown errors
    const errorMessage = error instanceof Error ? error.message : 'An unknown API error occurred'
    throw new ApiClientError(
      errorMessage,
      0, // Status code 0 for network or other unknown errors
      { error: errorMessage }
    )
  }
}
