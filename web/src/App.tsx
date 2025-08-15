import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/auth'
import { AppShell } from '@/components/layout/app-shell'
import { LoginPage } from '@/pages/login'
import { DashboardPage } from '@/pages/dashboard'
import { SettingsPage } from '@/pages/settings'
import { IndexingPage } from '@/pages/indexing'
import { FilesPage } from '@/pages/files'
import { UsersPage } from '@/pages/users'
import { LogsPage } from '@/pages/logs'

function App() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/files" element={<FilesPage />} />
        {user.role === 'ADMIN' && (
          <>
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/indexing" element={<IndexingPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/logs" element={<LogsPage />} />
          </>
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}

export default App
