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
