import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { logsApi, LogEntry } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  ListOrdered, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Copy,
  MoveRight,
  Trash2,
  Clock,
  User,
  FileText
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

const ACTION_ICONS = {
  COPIED: Copy,
  MOVED: MoveRight,
  DELETED_RETENTION: Clock,
  DELETED_MANUAL: Trash2,
}

const ACTION_COLORS = {
  COPIED: 'text-blue-500',
  MOVED: 'text-orange-500',
  DELETED_RETENTION: 'text-yellow-500',
  DELETED_MANUAL: 'text-red-500',
}

const ACTION_LABELS = {
  COPIED: 'Copied',
  MOVED: 'Moved',
  DELETED_RETENTION: 'Auto Deleted',
  DELETED_MANUAL: 'Manually Deleted',
}

export function LogsPage() {
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('')

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['logs', page, searchTerm, actionFilter],
    queryFn: () => logsApi.list({
      page,
      limit: 20,
      filename: searchTerm || undefined,
      action: actionFilter || undefined,
    }).then(res => res.data),
  })

  const { data: stats } = useQuery({
    queryKey: ['log-stats'],
    queryFn: () => logsApi.stats().then(res => res.data),
  })

  const logs = logsData?.logs || []
  const totalPages = logsData?.totalPages || 1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Activity Logs
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">
          Track all file operations and system activities
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Total Logs</p>
                  <p className="text-2xl font-bold">{stats.totalLogs}</p>
                </div>
                <ListOrdered className="h-8 w-8 text-zinc-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Copied</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.actionCounts.COPIED}</p>
                </div>
                <Copy className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Moved</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.actionCounts.MOVED}</p>
                </div>
                <MoveRight className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Auto Deleted</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.actionCounts.DELETED_RETENTION}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Manual Deleted</p>
                  <p className="text-2xl font-bold text-red-600">{stats.actionCounts.DELETED_MANUAL}</p>
                </div>
                <Trash2 className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Search by filename..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-full sm:w-48">
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm"
              >
                <option value="">All Actions</option>
                <option value="COPIED">Copied</option>
                <option value="MOVED">Moved</option>
                <option value="DELETED_RETENTION">Auto Deleted</option>
                <option value="DELETED_MANUAL">Manual Deleted</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            Detailed log of all file operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="w-8 h-8 bg-zinc-200 rounded"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-zinc-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-zinc-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-6 bg-zinc-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          ) : logs.length > 0 ? (
            <div className="space-y-2">
              {logs.map((log) => {
                const ActionIcon = ACTION_ICONS[log.action]
                return (
                  <div key={log.id} className="flex items-center space-x-4 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <div className={cn("p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800", ACTION_COLORS[log.action])}>
                      <ActionIcon className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4 text-zinc-500" />
                        <span className="font-medium text-sm truncate">{log.filename}</span>
                        <Badge variant="outline" className="text-xs">
                          {ACTION_LABELS[log.action]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-zinc-500">
                        <span>{formatDate(log.createdAt)}</span>
                        {log.actorUsername && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {log.actorUsername}
                          </span>
                        )}
                        {log.sourcePath && (
                          <span className="truncate max-w-xs" title={log.sourcePath}>
                            From: {log.sourcePath}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <ListOrdered className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                No logs found
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                {searchTerm || actionFilter 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Activity logs will appear here as operations are performed.'
                }
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
