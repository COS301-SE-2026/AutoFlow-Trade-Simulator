const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor( message: string, public status: number, public data?: any ) 
  {
    super(message);
    this.name = 'ApiError';
  }
}

export async function getBackendHealth(): Promise<{ status: string } | null> {
  try {
    const response = await fetch(`${apiUrl}/health`, { cache: "no-store" });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as { status: string };
  } catch {
    return null;
  }
}

function getToken()
{
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('token');
}

export async function apiClient(endpoint: string, options: any = {}) 
{
  const token = getToken();

  const headers: any = {
    'Content-Type': 'application/json',
    ...options.headers
  }

  if (token)
  {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${apiUrl}${endpoint}`, {
    ...options,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) 
  {
    let errorData: any;
    try 
    {
      errorData = await response.json();
    } 
    catch 
    {
      errorData = {};
    }

    const errorMessage = errorData.message || `API request failed with status ${response.status}`;
    const error = new ApiError(errorMessage, response.status, errorData);
    
    if (response.status === 401 && token && typeof window !== 'undefined') 
    {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      window.location.replace('/login');
      return new Promise(() => {});
    }

    throw error;
  }

  return response.json();
}