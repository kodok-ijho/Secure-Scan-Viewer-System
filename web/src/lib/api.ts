import axios, { AxiosResponse } from 'axios'

const API_BASE_URL = 'http://localhost:4000/api'

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

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          })
          
          const { accessToken } = response.data
          localStorage.setItem('accessToken', accessToken)
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
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
  accessToken: string
  refreshToken: string
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
  
  refresh: (refreshToken: string): Promise<AxiosResponse<{ accessToken: string }>> =>
    api.post('/auth/refresh', { refreshToken }),
  
  logout: (refreshToken?: string): Promise<AxiosResponse<{ message: string }>> =>
    api.post('/auth/logout', { refreshToken }),
}

export const settingsApi = {
  get: (): Promise<AxiosResponse<Settings>> =>
    api.get('/settings'),
  
  update: (data: Partial<Settings>): Promise<AxiosResponse<Settings>> =>
    api.patch('/settings', data),
  
  testAccess: (sourceFolder?: string): Promise<AxiosResponse<{ accessible: boolean; error?: string }>> =>
    api.post('/settings/test-access', { sourceFolder }),
}

export const indexingApi = {
  index: (mode: 'COPY' | 'MOVE'): Promise<AxiosResponse<IndexingResult>> =>
    api.post('/index', { mode }),
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
    page?: number
    limit?: number
    action?: string
    filename?: string
  }): Promise<AxiosResponse<LogsResponse>> =>
    api.get('/logs', { params }),
  
  get: (id: string): Promise<AxiosResponse<LogEntry>> =>
    api.get(`/logs/${id}`),
  
  stats: (): Promise<AxiosResponse<{
    totalLogs: number
    actionCounts: Record<string, number>
    recentActivity: number
  }>> =>
    api.get('/logs/stats'),
}
