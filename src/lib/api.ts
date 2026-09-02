const API_BASE = "/api";

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Network error" }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

// ── Categories ──────────────────────────────────────────────────────────────

export const categoriesAPI = {
  list: () => fetchAPI<any[]>("/categories"),
  tree: () => fetchAPI<any[]>("/categories/tree"),
  getBySlug: (slug: string) => fetchAPI<any>(`/categories/${slug}`),
};

// ── Products ────────────────────────────────────────────────────────────────

export const productsAPI = {
  list: () => fetchAPI<any[]>("/products"),
  get: (id: string) => fetchAPI<any>(`/products/${id}`),
  getPricingSchema: (id: string) => fetchAPI<any>(`/products/${id}/pricing-schema`),
};

// ── Calculator ──────────────────────────────────────────────────────────────

export const calculatorAPI = {
  quote: (data: { productId?: string; categoryId?: string; inputs: any }) =>
    fetchAPI<any>("/calculator/quote", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ── Quotes ──────────────────────────────────────────────────────────────────

export const quotesAPI = {
  list: () => fetchAPI<any[]>("/quotes"),
  create: (data: { customerId: string; lines?: any[]; notes?: string }) =>
    fetchAPI<any>("/quotes", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ── Jobs ────────────────────────────────────────────────────────────────────

export const jobsAPI = {
  list: () => fetchAPI<any[]>("/jobs"),
  get: (id: string) => fetchAPI<any>(`/jobs/${id}`),
  updateStatus: (id: string, data: { status: string; changedBy: string; note?: string }) =>
    fetchAPI<any>(`/jobs/${id}/status`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ── Inventory ───────────────────────────────────────────────────────────────

export const inventoryAPI = {
  list: () => fetchAPI<any[]>("/inventory"),
  lowStock: () => fetchAPI<any[]>("/inventory/low-stock"),
};

// ── Chat ────────────────────────────────────────────────────────────────────

export const chatAPI = {
  getThreads: (jobId: string) => fetchAPI<any[]>(`/chat/threads/${jobId}`),
  sendMessage: (threadId: string, data: { senderId: string; body: string }) =>
    fetchAPI<any>(`/chat/threads/${threadId}/messages`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
