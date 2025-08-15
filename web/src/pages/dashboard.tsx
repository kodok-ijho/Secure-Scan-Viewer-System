import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth'
import { filesApi, settingsApi, logsApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, HardDrive, Clock, Activity } from 'lucide-react'
import { formatFileSize, formatDate } from '@/lib/utils'

export function DashboardPage() {
  const { user } = useAuth()

  const { data: files = [] } = useQuery({
    queryKey: ['files'],
    queryFn: () => filesApi.list().then(res => res.data),
  })

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.get().then(res => res.data),
    enabled: user?.role === 'ADMIN',
  })

  const { data: logStats } = useQuery({
    queryKey: ['log-stats'],
    queryFn: () => logsApi.stats().then(res => res.data),
    enabled: user?.role === 'ADMIN',
  })

  const totalSize = files.reduce((acc, file) => acc + file.size, 0)
  const recentFiles = files.slice(0, 5)

  if (user?.role === 'USER') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            My Files
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Welcome back, {user.username}. Here's an overview of your documents.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Files</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{files.length}</div>
              <p className="text-xs text-muted-foreground">
                Documents in your collection
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Size</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatFileSize(totalSize)}</div>
              <p className="text-xs text-muted-foreground">
                Storage used by your files
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {recentFiles.length > 0 ? formatDate(recentFiles[0].modifiedAt) : 'No files'}
              </div>
              <p className="text-xs text-muted-foreground">
                Last file activity
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Files</CardTitle>
            <CardDescription>
              Your most recently modified documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentFiles.length > 0 ? (
              <div className="space-y-3">
                {recentFiles.map((file) => (
                  <div key={file.name} className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-zinc-500" />
                      <div>
                        <p className="font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-zinc-500">
                          {formatFileSize(file.size)} • {formatDate(file.modifiedAt)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{file.ext.toUpperCase()}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-zinc-500 py-8">
                No files found. Files will appear here once they are indexed.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Admin dashboard
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Admin Dashboard
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">
          System overview and management tools.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{files.length}</div>
            <p className="text-xs text-muted-foreground">
              Files in the system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(totalSize)}</div>
            <p className="text-xs text-muted-foreground">
              Total storage usage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logStats?.recentActivity || 0}</div>
            <p className="text-xs text-muted-foreground">
              Actions in last 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retention</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{settings?.retentionDays || 0}</div>
            <p className="text-xs text-muted-foreground">
              Days retention period
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Current system configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Source Folder</span>
              <span className="text-sm font-medium">{settings?.sourceFolder || 'Not configured'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Last Indexing</span>
              <span className="text-sm font-medium">
                {settings?.lastIndexingAt ? formatDate(settings.lastIndexingAt) : 'Never'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Indexing Mode</span>
              <Badge variant={settings?.lastIndexingMode ? 'default' : 'secondary'}>
                {settings?.lastIndexingMode || 'None'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Files</CardTitle>
            <CardDescription>
              Latest files in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentFiles.length > 0 ? (
              <div className="space-y-3">
                {recentFiles.map((file) => (
                  <div key={file.name} className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-zinc-500" />
                      <div>
                        <p className="font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-zinc-500">
                          Owner: {file.owner || 'Unassigned'} • {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{file.ext.toUpperCase()}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-zinc-500 py-8">
                No files found. Run indexing to populate files.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
