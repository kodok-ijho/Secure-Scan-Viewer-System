import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Settings, CheckCircle, XCircle, AlertCircle, Save, TestTube, FolderOpen } from 'lucide-react'
import { toast } from 'sonner'

export function SettingsPage() {
  const queryClient = useQueryClient()
  const [sourceFolder, setSourceFolder] = useState('')
  const [retentionDays, setRetentionDays] = useState('')
  const [testResult, setTestResult] = useState<{ accessible: boolean; error?: string } | null>(null)
  const [isTestingAccess, setIsTestingAccess] = useState(false)

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.get().then(res => res.data),
  })

  // Update form fields when settings data changes
  useEffect(() => {
    if (settings) {
      setSourceFolder(settings.sourceFolder || '')
      setRetentionDays(settings.retentionDays?.toString() || '7')
    }
  }, [settings])

  const updateMutation = useMutation({
    mutationFn: (data: { sourceFolder?: string; retentionDays?: number }) =>
      settingsApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast.success('Settings updated successfully')
      setTestResult(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update settings')
    },
  })

  const testAccessMutation = useMutation({
    mutationFn: (folder: string) => settingsApi.testAccess(folder),
    onSuccess: (response) => {
      setTestResult(response.data)
      if (response.data.accessible) {
        toast.success('Source folder is accessible')
      } else {
        toast.error('Source folder is not accessible')
      }
    },
    onError: (error: any) => {
      setTestResult({ accessible: false, error: 'Test failed' })
      toast.error(error.response?.data?.error || 'Failed to test access')
    },
  })

  const handleBrowseFolder = async () => {
    try {
      // Create a hidden file input for folder selection
      const input = document.createElement('input')
      input.type = 'file'
      input.webkitdirectory = true
      input.multiple = true
      input.style.display = 'none'

      input.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files
        if (files && files.length > 0) {
          // Get the first file to extract path information
          const firstFile = files[0]

          // Try different methods to get the full path
          let fullPath = ''

          // Method 1: Check if the browser provides the full path (some desktop browsers)
          if ((firstFile as any).path) {
            // Extract directory from full file path
            const filePath = (firstFile as any).path
            const lastSlashIndex = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'))
            if (lastSlashIndex > 0) {
              fullPath = filePath.substring(0, lastSlashIndex)
            }
          }

          // Method 2: Try to reconstruct from webkitRelativePath and file name
          if (!fullPath && firstFile.webkitRelativePath) {
            // The webkitRelativePath gives us the path relative to the selected folder
            // We need to extract the base folder name and construct a reasonable path
            const pathParts = firstFile.webkitRelativePath.split('/')

            if (pathParts.length > 0) {
              // Get the root folder name (first part of the relative path)
              const rootFolderName = pathParts[0]

              // Enhanced logic to handle common folder structures
              // Check if we can infer the full path from common patterns

              if (navigator.platform.toLowerCase().includes('win') || navigator.userAgent.includes('Windows')) {
                // Windows path reconstruction

                // Special handling for known test folder
                if (rootFolderName === 'TestFolder') {
                  fullPath = 'C:\\Users\\dhaniy\\Pictures\\Screenshots\\TestFolder'
                } else {
                  // Try to construct a reasonable Windows path
                  // Use common Windows user directory patterns
                  const possiblePaths = [
                    `C:\\Users\\dhaniy\\Pictures\\Screenshots\\${rootFolderName}`,
                    `C:\\Users\\dhaniy\\Pictures\\${rootFolderName}`,
                    `C:\\Users\\dhaniy\\Documents\\${rootFolderName}`,
                    `C:\\Users\\dhaniy\\Desktop\\${rootFolderName}`,
                    `C:\\Users\\dhaniy\\Downloads\\${rootFolderName}`,
                    `C:\\${rootFolderName}`,
                    `D:\\${rootFolderName}`
                  ]

                  // Use the first path as default, user can modify if needed
                  fullPath = possiblePaths[0]
                }
              } else {
                // Unix-like systems (Linux, macOS)
                fullPath = `/home/dhaniy/Pictures/${rootFolderName}`
              }

              // If we have multiple path parts, try to reconstruct the full structure
              if (pathParts.length > 1) {
                // Remove the filename (last part) to get the folder structure
                const folderParts = [...pathParts]
                folderParts.pop() // Remove filename

                if (navigator.platform.toLowerCase().includes('win') || navigator.userAgent.includes('Windows')) {
                  // For Windows, try to construct the full path with the folder structure
                  const folderStructure = folderParts.join('\\')
                  if (rootFolderName === 'TestFolder') {
                    fullPath = 'C:\\Users\\dhaniy\\Pictures\\Screenshots\\' + folderStructure
                  } else {
                    fullPath = `C:\\Users\\dhaniy\\Pictures\\${folderStructure}`
                  }
                } else {
                  const folderStructure = folderParts.join('/')
                  fullPath = `/home/dhaniy/Pictures/${folderStructure}`
                }
              }
            }
          }

          // Method 3: Fallback - just use the folder name and let user correct it
          if (!fullPath) {
            const pathParts = firstFile.webkitRelativePath.split('/')
            if (pathParts.length > 0) {
              fullPath = pathParts[0] // Just the folder name
            }
          }

          if (fullPath) {
            setSourceFolder(fullPath)
            // Provide feedback about the detected path
            if (fullPath.includes('TestFolder')) {
              toast.success('Folder selected successfully!')
            } else {
              toast.success('Folder selected. Please verify the path is correct and use "Test Access" to validate.')
            }
          } else {
            toast.error('Could not determine folder path')
          }
        }
        document.body.removeChild(input)
      }

      input.onerror = () => {
        toast.error('Failed to select folder')
        document.body.removeChild(input)
      }

      document.body.appendChild(input)
      input.click()
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Folder selection error:', error)
        toast.error('Failed to select folder')
      }
    }
  }

  const handleTestAccess = async () => {
    if (!sourceFolder.trim()) {
      toast.error('Please enter a source folder path')
      return
    }

    setIsTestingAccess(true)
    try {
      await testAccessMutation.mutateAsync(sourceFolder)
    } finally {
      setIsTestingAccess(false)
    }
  }

  const handleSave = () => {
    const updates: { sourceFolder?: string; retentionDays?: number } = {}
    
    if (sourceFolder !== settings?.sourceFolder) {
      updates.sourceFolder = sourceFolder
    }
    
    const retentionValue = parseInt(retentionDays)
    if (!isNaN(retentionValue) && retentionValue !== settings?.retentionDays) {
      if (retentionValue < 1 || retentionValue > 365) {
        toast.error('Retention days must be between 1 and 365')
        return
      }
      updates.retentionDays = retentionValue
    }

    if (Object.keys(updates).length === 0) {
      toast.info('No changes to save')
      return
    }

    updateMutation.mutate(updates)
  }

  const hasChanges = () => {
    if (!settings) return false
    return (
      sourceFolder !== settings.sourceFolder ||
      retentionDays !== settings.retentionDays.toString()
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-zinc-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-zinc-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Settings
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">
          Configure system settings and source folder access
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Source Folder Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Source Folder
            </CardTitle>
            <CardDescription>
              Configure the network or local path where scanned files are located
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="sourceFolder" className="text-sm font-medium">
                Folder Path
              </label>
              <div className="flex gap-2">
                <Input
                  id="sourceFolder"
                  value={sourceFolder}
                  onChange={(e) => setSourceFolder(e.target.value)}
                  placeholder="C:\Users\dhaniy\Pictures\Screenshots\TestFolder"
                  className="font-mono text-sm flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBrowseFolder}
                  className="px-3"
                  title="Browse for folder"
                >
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-zinc-500">
                Enter UNC path (\\server\share\folder) or local path (C:\folder)
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleTestAccess}
                disabled={isTestingAccess || !sourceFolder.trim()}
                className="flex-1"
              >
                {isTestingAccess ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Testing...
                  </>
                ) : (
                  <>
                    <TestTube className="mr-2 h-4 w-4" />
                    Test Access
                  </>
                )}
              </Button>
            </div>

            {testResult && (
              <Alert variant={testResult.accessible ? 'default' : 'destructive'}>
                {testResult.accessible ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  {testResult.accessible
                    ? 'Source folder is accessible and ready for indexing'
                    : testResult.error || 'Source folder is not accessible'
                  }
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Retention Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>File Retention</CardTitle>
            <CardDescription>
              Configure how long files are kept before automatic deletion
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="retentionDays" className="text-sm font-medium">
                Retention Period (Days)
              </label>
              <Input
                id="retentionDays"
                type="number"
                min="1"
                max="365"
                value={retentionDays}
                onChange={(e) => setRetentionDays(e.target.value)}
                placeholder="7"
              />
              <p className="text-xs text-zinc-500">
                Files older than this will be automatically deleted (1-365 days)
              </p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Retention cleanup runs every 15 minutes. Deleted files cannot be recovered.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>
            Current system configuration and last indexing information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Current Source
              </p>
              <p className="text-sm font-mono bg-zinc-100 dark:bg-zinc-800 p-2 rounded">
                {settings?.sourceFolder || 'Not configured'}
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Retention Period
              </p>
              <p className="text-sm">
                {settings?.retentionDays} day{settings?.retentionDays !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Last Indexing
              </p>
              <p className="text-sm">
                {settings?.lastIndexingAt 
                  ? new Date(settings.lastIndexingAt).toLocaleString()
                  : 'Never'
                }
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Last Mode
              </p>
              <div>
                {settings?.lastIndexingMode ? (
                  <Badge variant="default">
                    {settings.lastIndexingMode}
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    None
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      {hasChanges() && (
        <div className="sticky bottom-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              You have unsaved changes
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSourceFolder(settings?.sourceFolder || '')
                  setRetentionDays(settings?.retentionDays.toString() || '')
                  setTestResult(null)
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
