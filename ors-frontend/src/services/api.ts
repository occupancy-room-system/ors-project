export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(endpoint, {
    headers: {
      'Content-Control': 'no-cache',
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new ApiError(json.message || 'API request failed', response.status);
  }

  return json.data as T;
}

