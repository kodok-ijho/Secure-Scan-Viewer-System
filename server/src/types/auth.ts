// Define role types
export type Role = 'ADMIN' | 'USER'

export interface JwtPayload {
  userId: string
  username: string
  role: Role
  type: 'access' | 'refresh'
}

export interface AuthenticatedUser {
  id: string
  username: string
  role: Role
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    username: string
    role: Role
  }
}

export interface RefreshRequest {
  refreshToken: string
}

export interface RefreshResponse {
  accessToken: string
}
