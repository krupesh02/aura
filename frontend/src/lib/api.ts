export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "bypass-tunnel-reminder": "true",
    "ngrok-skip-browser-warning": "true",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  console.log(`[API] Fetching: ${API_URL}${endpoint}`);
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || "Request failed");
  }

  return res.json();
}

// ===== Auth =====
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: string;
  createdAt: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const api = {
  auth: {
    register: (data: { email: string; name: string; password: string }) =>
      request<AuthResponse>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    login: (data: { email: string; password: string }) =>
      request<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    me: () => request<User>("/api/auth/me"),
  },

  // ===== Client Folders =====
  folders: {
    create: (data: { name: string; description?: string; price?: number; isPaid?: boolean; whatsappNo?: string }) =>
      request<any>("/api/folders/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    list: () => request<any[]>("/api/folders/"),
    get: (id: string) => request<any>(`/api/folders/${id}`),
    update: (id: string, data: any) =>
      request<any>(`/api/folders/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<any>(`/api/folders/${id}`, { method: "DELETE" }),
  },

  // ===== Events (Sub-events) =====
  events: {
    create: (data: { clientFolderId: string; name: string; description?: string; eventDate?: string }) =>
      request<any>("/api/events/", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    list: () => request<any[]>("/api/events/"),

    get: (id: string) => request<any>(`/api/events/${id}`),

    update: (id: string, data: any) =>
      request<any>(`/api/events/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      request<any>(`/api/events/${id}`, { method: "DELETE" }),
  },

  // ===== Photos =====
  photos: {
    upload: (eventId: string, file: File) => {
      const formData = new FormData();
      formData.append("event_id", eventId);
      formData.append("file", file);
      return request<any>("/api/photos/upload", {
        method: "POST",
        body: formData,
      });
    },

    listByEvent: (eventId: string, page = 1, pageSize = 20) =>
      request<any>(`/api/photos/event/${eventId}?page=${page}&page_size=${pageSize}`),

    delete: (id: string) =>
      request<any>(`/api/photos/${id}`, { method: "DELETE" }),
  },

  // ===== Payments =====
  payments: {
    createOrder: (data: { clientFolderId?: string; amount: number; guestName: string; paymentType?: string }) =>
      request<any>("/api/payments/create-order", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    verify: (data: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      clientFolderId?: string;
    }) =>
      request<any>("/api/payments/verify", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  // ===== Search =====
  search: {
    byFace: (file: File, eventId?: string) => {
      const formData = new FormData();
      formData.append("file", file);
      if (eventId) formData.append("event_id", eventId);
      return request<any[]>("/api/search/face", {
        method: "POST",
        body: formData,
      });
    },
  },

  // ===== Public (No Auth Required) =====
  public: {
    getFolder: (id: string) => request<any>(`/api/folders/${id}/public`),
    getEvent: (id: string) => request<any>(`/api/events/${id}/public`),
    getEventPhotos: (id: string, page = 1, pageSize = 100) =>
      request<any>(`/api/photos/public/event/${id}?page=${page}&page_size=${pageSize}`),
    getFolderPhotos: (id: string, page = 1, pageSize = 200) =>
      request<any>(`/api/photos/public/folder/${id}?page=${page}&page_size=${pageSize}`),
    searchPhotosByFace: (file: File, folderId?: string) => {
      const formData = new FormData();
      formData.append("file", file);
      
      if (folderId) {
        formData.append("folder_id", folderId);
        return request<any[]>("/api/search/public/face", {
          method: "POST",
          body: formData,
        });
      } else {
        return request<any[]>("/api/search/public/events-by-face", {
          method: "POST",
          body: formData,
        });
      }
    },
    // Keep this for backward compatibility if needed
    searchFace: (folderId: string, file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder_id", folderId);
      return request<any[]>("/api/search/public/face", {
        method: "POST",
        body: formData,
      });
    },
    searchEventsByFace: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return request<{ totalMatches: number; folderSummaries: any[]; tempSelfieId: string }>("/api/search/public/events-by-face", {
        method: "POST",
        body: formData,
      });
    },
    getUnifiedGallery: (file: File, guestToken: string) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("guest_token", guestToken);
      return request<any[]>("/api/search/public/unified-gallery", {
        method: "POST",
        body: formData,
      });
    },
  },
};

