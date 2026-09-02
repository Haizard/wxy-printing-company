import { useState, useEffect, useCallback } from "react";

// ── Auth header helper ──────────────────────────────────────────────────────

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("printhub_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Generic fetch hook ──────────────────────────────────────────────────────

export function useFetch<T>(url: string, options?: RequestInit) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(url, {
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        ...options,
      });
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ── Mutations hook ──────────────────────────────────────────────────────────

export function useMutation<TData, TVariables>(
  url: string,
  method: string = "POST",
) {
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (variables: TVariables) => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify(variables),
        });
        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          throw new Error(errBody.error || `API error: ${response.status}`);
        }
        const result = await response.json();
        setData(result);
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [url, method],
  );

  return { data, loading, error, mutate };
}

// ── Domain-specific hooks ───────────────────────────────────────────────────

export function useCategories() {
  return useFetch<any[]>("/api/categories");
}

export function useCategoryTree() {
  return useFetch<any[]>("/api/categories/tree");
}

export function useProducts() {
  return useFetch<any[]>("/api/products");
}

export function useProduct(id: string | null) {
  return useFetch<any>(id ? `/api/products/${id}` : "");
}

export function useQuotes() {
  return useFetch<any[]>("/api/quotes");
}

export function useJobs() {
  return useFetch<any[]>("/api/jobs");
}

export function useOrders() {
  return useFetch<any[]>("/api/orders");
}

export function useInventory() {
  return useFetch<any[]>("/api/inventory");
}

export function useLowStock() {
  return useFetch<any[]>("/api/inventory/low-stock");
}

export function useChatThreads(jobId: string | null) {
  return useFetch<any[]>(jobId ? `/api/chat/threads/${jobId}` : "");
}

export function useCreateQuote() {
  return useMutation<any, { customerId: string; notes?: string }>("/api/quotes");
}

export function useUpdateJobStatus() {
  return useMutation<any, { status: string; changedBy: string; note?: string }>(
    "/api/jobs/status",
    "POST",
  );
}

export function useCalculatePrice() {
  return useMutation<
    any,
    { productId?: string; categoryId?: string; inputs: any }
  >("/api/calculator/quote");
}
