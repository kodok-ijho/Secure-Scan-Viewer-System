import axios, { AxiosResponse } from 'axios'

// Get API base URL from environment variables
export const API_BASE = (import.meta.env as any).VITE_API_URL || 'http://localhost:4000';
export const apiUrl = (path: string) =>
  `${API_BASE.replace(/\/+$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;

const API_BASE_URL = apiUrl('/api')

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
})

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, redirect to login
      localStorage.removeItem('accessToken')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API types
export interface User {
  id: string
  username: string
  role: 'ADMIN' | 'USER'
  createdAt: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface FileInfo {
  name: string
  size: number
  ext: string
  modifiedAt: string
  owner: string | null
  fullPathHidden: true
}

export interface Settings {
  sourceFolder: string
  retentionDays: number
  lastIndexingAt?: string | null
  lastIndexingMode?: 'COPY' | 'MOVE' | null
}

export interface IndexingResult {
  totalFound: number
  totalProcessed: number
  skipped: number
  targetDir: string
  errors: string[]
}

export interface LogEntry {
  id: string
  filename: string
  sourcePath: string | null
  localPath: string
  action: 'COPIED' | 'MOVED' | 'DELETED_RETENTION' | 'DELETED_MANUAL'
  actorUsername: string | null
  createdAt: string
}

export interface LogsResponse {
  logs: LogEntry[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// API functions
export const authApi = {
  login: (data: LoginRequest): Promise<AxiosResponse<LoginResponse>> =>
    api.post('/auth/login', data),

  me: (): Promise<AxiosResponse<{ user: User }>> =>
    api.get('/auth/me'),
}

export const settingsApi = {
  get: (): Promise<AxiosResponse<Settings>> =>
    api.get('/settings'),

  update: (data: Partial<Settings>): Promise<AxiosResponse<Settings>> =>
    api.put('/settings', data),

  testAccess: (folderPath: string): Promise<AxiosResponse<{ success: boolean; message?: string; error?: string }>> =>
    api.post('/settings/test-access', { folderPath }),
}

export const indexingApi = {
  run: (mode: 'COPY' | 'MOVE'): Promise<AxiosResponse<{ success: boolean; mode: string; results: any; timestamp: string }>> =>
    api.post('/indexing/run', { mode }),
}

export const filesApi = {
  list: (owner?: string): Promise<AxiosResponse<FileInfo[]>> =>
    api.get('/files', { params: { owner } }),

  stream: (filename: string): string => {
    const token = localStorage.getItem('accessToken')
    return `${API_BASE_URL}/files/${encodeURIComponent(filename)}/stream?token=${encodeURIComponent(token || '')}`
  },

  download: (filename: string): string => {
    const token = localStorage.getItem('accessToken')
    return `${API_BASE_URL}/files/${encodeURIComponent(filename)}/download?token=${encodeURIComponent(token || '')}`
  },

  delete: (filename: string): Promise<AxiosResponse<{ message: string }>> =>
    api.delete(`/files/${encodeURIComponent(filename)}`),

  deleteAll: (): Promise<AxiosResponse<{ message: string; deletedCount: number; errors: string[] }>> =>
    api.delete('/files'),

  assign: (filename: string, userId: string): Promise<AxiosResponse<{ message: string; filename: string; assignedTo: string }>> =>
    api.patch(`/files/${encodeURIComponent(filename)}/assign`, { userId }),

  unassign: (filename: string): Promise<AxiosResponse<{ message: string; filename: string }>> =>
    api.patch(`/files/${encodeURIComponent(filename)}/unassign`),
}

export const usersApi = {
  list: (): Promise<AxiosResponse<User[]>> =>
    api.get('/users'),
  
  create: (data: { username: string; password: string; role: 'ADMIN' | 'USER' }): Promise<AxiosResponse<User>> =>
    api.post('/users', data),
  
  get: (id: string): Promise<AxiosResponse<User>> =>
    api.get(`/users/${id}`),
  
  update: (id: string, data: { username?: string; role?: 'ADMIN' | 'USER' }): Promise<AxiosResponse<User>> =>
    api.patch(`/users/${id}`, data),

  changePassword: (id: string, data: { password: string }): Promise<AxiosResponse<{ message: string }>> =>
    api.patch(`/users/${id}/password`, data),

  delete: (id: string): Promise<AxiosResponse<{ message: string }>> =>
    api.delete(`/users/${id}`),
}

export const logsApi = {
  list: (params?: {
    search?: string
    action?: string
  }): Promise<AxiosResponse<LogEntry[]>> =>
    api.get('/logs', { params }),
}

export const dashboardApi = {
  stats: (): Promise<AxiosResponse<{
    totalFiles: number
    totalSize: number
    recentActivity: number
    retentionDays: number
    lastIndexing: string | null
    indexingMode: string | null
    sourceFolder: string | null
    recentLogs: LogEntry[]
  }>> =>
    api.get('/dashboard/stats'),
}
