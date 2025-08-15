import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  Settings, 
  Copy, 
  FileText, 
  Users, 
  ListOrdered, 
  Menu, 
  X,
  LogOut,
  User
} from 'lucide-react'
import { useAuth } from '@/contexts/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home, roles: ['ADMIN', 'USER'] },
    { name: 'Files', href: '/files', icon: FileText, roles: ['ADMIN', 'USER'] },
    { name: 'Settings', href: '/settings', icon: Settings, roles: ['ADMIN'] },
    { name: 'Indexing', href: '/indexing', icon: Copy, roles: ['ADMIN'] },
    { name: 'Users', href: '/users', icon: Users, roles: ['ADMIN'] },
    { name: 'Logs', href: '/logs', icon: ListOrdered, roles: ['ADMIN'] },
  ]

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user?.role || 'USER')
  )

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-0 z-50 lg:hidden",
        sidebarOpen ? "block" : "hidden"
      )}>
        <div className="fixed inset-0 bg-black/20" onClick={() => setSidebarOpen(false)} />
        <div className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-zinc-950 shadow-xl">
          <SidebarContent 
            navigation={filteredNavigation}
            currentPath={location.pathname}
            user={user}
            onLogout={handleLogout}
            onClose={() => setSidebarOpen(false)}
          />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800">
          <SidebarContent 
            navigation={filteredNavigation}
            currentPath={location.pathname}
            user={user}
            onLogout={handleLogout}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-zinc-200 bg-white/80 backdrop-blur px-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/80 sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Secure Scanner Viewer
              </h1>
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="flex items-center gap-x-2">
                <User className="h-4 w-4 text-zinc-500" />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {user?.username}
                </span>
                <Badge variant={user?.role === 'ADMIN' ? 'default' : 'secondary'}>
                  {user?.role}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

interface SidebarContentProps {
  navigation: Array<{
    name: string
    href: string
    icon: React.ComponentType<{ className?: string }>
    roles: string[]
  }>
  currentPath: string
  user: any
  onLogout: () => void
  onClose?: () => void
}

function SidebarContent({ navigation, currentPath, user, onLogout, onClose }: SidebarContentProps) {
  return (
    <>
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-x-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Scanner Viewer
          </span>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto lg:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      <nav className="flex flex-1 flex-col px-6">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => {
                const isActive = currentPath === item.href
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      onClick={onClose}
                      className={cn(
                        "group flex gap-x-3 rounded-xl p-3 text-sm font-medium leading-6 transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-zinc-700 hover:text-primary hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </li>
          <li className="mt-auto">
            <Button
              variant="ghost"
              className="w-full justify-start gap-x-3 text-zinc-700 hover:text-destructive hover:bg-destructive/10 dark:text-zinc-300"
              onClick={onLogout}
            >
              <LogOut className="h-5 w-5" />
              Sign out
            </Button>
          </li>
        </ul>
      </nav>
    </>
  )
}
