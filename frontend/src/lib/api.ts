import axios, { AxiosInstance, AxiosError } from "axios";

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL
  ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1`
  : "/api/v1";

export const api: AxiosInstance = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    if (err.response?.status === 401) {
      const refresh = localStorage.getItem("refresh_token");
      if (refresh) {
        try {
          const { data } = await axios.post(`${BASE}/auth/refresh`, {
            refresh_token: refresh,
          });
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token);
          if (err.config) {
            err.config.headers.Authorization = `Bearer ${data.access_token}`;
            return api(err.config);
          }
        } catch {
          localStorage.clear();
          window.location.href = "/login";
        }
      } else {
        localStorage.clear();
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export interface UserInfo {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
  role: string;
  department: string;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: UserInfo;
}

export interface DocumentInfo {
  id: string;
  doc_id: string;
  filename: string;
  file_type: string;
  file_size_bytes: number;
  chunk_count: number;
  page_count: number;
  department: string;
  is_global: boolean;
  description: string | null;
  tags: string | null;
  expires_at: string | null;
  version: number;
  previous_version_id: string | null;
  upload_timestamp: string;
  uploaded_by: string | null;
}

export interface SourceChunk {
  text: string;
  source_doc: string;
  doc_id: string;
  page: number;
  chunk_index: number;
  relevance_score: number;
}

export interface QueryResponse {
  answer: string;
  sources: SourceChunk[];
  conversation_id: string;
  message_id: string;
  query: string;
  model_used: string;
  retrieval_time_ms: number;
  generation_time_ms: number;
  total_time_ms: number;
  chunks_retrieved: number;
}

export interface MessageSchema {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources: SourceChunk[] | null;
  created_at: string;
}

export interface ConversationSchema {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface ConversationDetail {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  messages: MessageSchema[];
}

export interface IngestResponse {
  doc_id: string;
  filename: string;
  file_type: string;
  total_chunks: number;
  pages_processed: number;
  status: string;
  message: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  conversation_id: string | null;
  action: string;
  query_text: string | null;
  status: string;
  retrieval_time_ms: number | null;
  generation_time_ms: number | null;
  total_chunks_retrieved: number | null;
  ip_address: string | null;
  error_message: string | null;
  timestamp: string;
}

export interface SystemStats {
  users: { total: number; active: number; inactive: number };
  documents: { total: number; global: number; department_specific: number };
  conversations: { total: number; total_messages: number };
  queries: { total: number; no_results: number; success_rate: number };
  vector_store: { total_chunks: number; collection_name: string };
}

export const authApi = {
  register: (data: {
    username: string;
    email: string;
    password: string;
    full_name?: string;
    department?: string;
  }) => api.post<UserInfo>("/auth/register", data),

  login: (username: string, password: string) =>
    api.post<TokenResponse>("/auth/login", { username, password }),

  refresh: (refresh_token: string) =>
    api.post<TokenResponse>("/auth/refresh", { refresh_token }),

  me: () => api.get<UserInfo>("/auth/me"),

  updateMe: (data: { full_name?: string; department?: string }) =>
    api.put<UserInfo>("/auth/me", data),

  listUsers: () => api.get<UserInfo[]>("/auth/users"),

  updateUserRole: (userId: string, role: string, department?: string) =>
    api.put<UserInfo>(`/auth/users/${userId}/role`, { role, department }),

  deactivateUser: (userId: string) =>
    api.delete(`/auth/users/${userId}`),
};

export const documentsApi = {
  list: (department?: string) =>
    api.get<DocumentInfo[]>("/documents", { params: { department } }),

  get: (docId: string) => api.get<DocumentInfo>(`/documents/${docId}`),

  delete: (docId: string) => api.delete(`/documents/${docId}`),

  stats: () =>
    api.get<{ total_documents: number; total_chunks: number; collection_name: string }>(
      "/documents/stats"
    ),

  upload: (
    file: File,
    department: string,
    isGlobal: boolean,
    description?: string,
    tags?: string
  ) => {
    const form = new FormData();
    form.append("file", file);
    form.append("department", department);
    form.append("is_global", String(isGlobal));
    if (description) form.append("description", description);
    if (tags) form.append("tags", tags);
    const token = localStorage.getItem("access_token");
    return axios.post<IngestResponse>(`${BASE}/ingest/upload`, form, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: token ? `Bearer ${token}` : "",
      },
      timeout: 120000,
    });
  },
};

export const queryApi = {
  ask: (data: {
    query: string;
    conversation_id?: string;
    top_k?: number;
    include_sources?: boolean;
    doc_filter?: string[];
  }) => api.post<QueryResponse>("/query", data),
};

export const conversationsApi = {
  list: () => api.get<ConversationSchema[]>("/conversations"),

  get: (id: string) => api.get<ConversationDetail>(`/conversations/${id}`),

  delete: (id: string) => api.delete(`/conversations/${id}`),

  clear: () => api.delete("/conversations"),
};

export const adminApi = {
  auditLogs: (params?: {
    limit?: number;
    offset?: number;
    action?: string;
    user_id?: string;
    status?: string;
  }) => api.get<AuditLog[]>("/admin/audit-logs", { params }),

  systemStats: () => api.get<SystemStats>("/admin/system-stats"),

  listVerifiedQAs: () => api.get<any[]>("/admin/verified-qa"),
  createVerifiedQA: (data: { question: string; answer: string; department: string }) =>
    api.post<any>("/admin/verified-qa", data),
  updateVerifiedQA: (id: string, data: { question: string; answer: string; department: string }) =>
    api.put<any>(`/admin/verified-qa/${id}`, data),
  deleteVerifiedQA: (id: string) => api.delete<any>(`/admin/verified-qa/${id}`),
};

export default api;
