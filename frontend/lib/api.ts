const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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

  if (response.status === 401)
  {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');

    window.location.href = '/login';

    throw new Error('Your session expired. Please log in again.');
  }
  
  if (!response.ok) 
  {
    const error = await response.json();
    throw new Error(error.message || 'API call failed');
  }

  return response.json();
}