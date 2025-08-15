import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LoginPage } from '@/pages/login'
import { AuthProvider } from '@/contexts/auth'

// Mock the auth API
vi.mock('@/lib/api', () => ({
  authApi: {
    login: vi.fn(),
  },
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )
}

describe('LoginPage', () => {
  it('renders login form', () => {
    render(<LoginPage />, { wrapper: createWrapper() })

    expect(screen.getByText('Secure Scanner Viewer')).toBeInTheDocument()
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    render(<LoginPage />, { wrapper: createWrapper() })

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(submitButton)

    // HTML5 validation should prevent submission
    const usernameInput = screen.getByLabelText(/username/i)
    expect(usernameInput).toBeInvalid()
  })

  it('submits form with valid data', async () => {
    const { authApi } = await import('@/lib/api')
    const mockLogin = authApi.login as any
    mockLogin.mockResolvedValue({
      data: {
        accessToken: 'token',
        refreshToken: 'refresh',
        user: { id: '1', username: 'test', role: 'USER' },
      },
    })

    render(<LoginPage />, { wrapper: createWrapper() })

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testuser' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    })

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123',
      })
    })
  })
})
