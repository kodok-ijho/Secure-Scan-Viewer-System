import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { indexingApi, IndexingResult } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Copy, 
  MoveRight, 
  Play, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FolderOpen,
  FileText
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function IndexingPage() {
  const queryClient = useQueryClient()
  const [selectedMode, setSelectedMode] = useState<'COPY' | 'MOVE'>('COPY')
  const [lastResult, setLastResult] = useState<IndexingResult | null>(null)

  const indexingMutation = useMutation({
    mutationFn: (mode: 'COPY' | 'MOVE') => indexingApi.run(mode),
    onSuccess: (response) => {
      const result = (response as any).data
      setLastResult(result)
      queryClient.invalidateQueries({ queryKey: ['files'] })
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      
      if (result.totalProcessed > 0) {
        toast.success(`Successfully ${selectedMode.toLowerCase()}ed ${result.totalProcessed} files`)
      } else if (result.totalFound === 0) {
        toast.info('No files found in source folder')
      } else {
        toast.warning('No files were processed')
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Indexing failed')
    },
  })

  const handleIndexing = () => {
    if (window.confirm(
      `Are you sure you want to ${selectedMode.toLowerCase()} files from the source folder? This action cannot be undone.`
    )) {
      indexingMutation.mutate(selectedMode)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Indexing
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">
          Copy or move files from the source folder to the local storage
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Mode Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Indexing Mode</CardTitle>
            <CardDescription>
              Choose how files should be transferred from the source folder
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div
                className={cn(
                  "p-4 rounded-xl border-2 cursor-pointer transition-all",
                  selectedMode === 'COPY'
                    ? "border-primary bg-primary/5"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                )}
                onClick={() => setSelectedMode('COPY')}
              >
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2",
                    selectedMode === 'COPY'
                      ? "border-primary bg-primary"
                      : "border-zinc-300 dark:border-zinc-600"
                  )}>
                    {selectedMode === 'COPY' && (
                      <div className="w-full h-full rounded-full bg-white scale-50"></div>
                    )}
                  </div>
                  <Copy className="h-5 w-5 text-blue-500" />
                  <div>
                    <h3 className="font-medium">Copy Files</h3>
                    <p className="text-sm text-zinc-500">
                      Duplicate files to local storage, keeping originals in source
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={cn(
                  "p-4 rounded-xl border-2 cursor-pointer transition-all",
                  selectedMode === 'MOVE'
                    ? "border-primary bg-primary/5"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                )}
                onClick={() => setSelectedMode('MOVE')}
              >
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2",
                    selectedMode === 'MOVE'
                      ? "border-primary bg-primary"
                      : "border-zinc-300 dark:border-zinc-600"
                  )}>
                    {selectedMode === 'MOVE' && (
                      <div className="w-full h-full rounded-full bg-white scale-50"></div>
                    )}
                  </div>
                  <MoveRight className="h-5 w-5 text-orange-500" />
                  <div>
                    <h3 className="font-medium">Move Files</h3>
                    <p className="text-sm text-zinc-500">
                      Transfer files to local storage, removing from source
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {selectedMode === 'COPY' 
                  ? 'Files will be copied to local storage. Original files remain in the source folder.'
                  : 'Files will be moved to local storage. Original files will be removed from the source folder.'
                }
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleIndexing}
              disabled={indexingMutation.isPending}
              size="lg"
              className="w-full"
            >
              {indexingMutation.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {selectedMode === 'COPY' ? 'Copying' : 'Moving'} Files...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Indexing ({selectedMode})
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Indexing Results</CardTitle>
            <CardDescription>
              Results from the last indexing operation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lastResult ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                    <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      {lastResult.totalFound}
                    </div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      Files Found
                    </div>
                  </div>
                  
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {lastResult.totalProcessed}
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400">
                      Processed
                    </div>
                  </div>
                  
                  <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {lastResult.skipped}
                    </div>
                    <div className="text-sm text-yellow-600 dark:text-yellow-400">
                      Skipped
                    </div>
                  </div>
                  
                  <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {lastResult.errors.length}
                    </div>
                    <div className="text-sm text-red-600 dark:text-red-400">
                      Errors
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">Target Directory:</span>
                    <code className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-xs">
                      {lastResult.targetDir}
                    </code>
                  </div>
                </div>

                {lastResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-red-600 dark:text-red-400">
                      Errors ({lastResult.errors.length})
                    </h4>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {lastResult.errors.map((error, index) => (
                        <div key={index} className="text-xs bg-red-50 dark:bg-red-900/20 p-2 rounded">
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Indexing completed successfully
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FolderOpen className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                  No indexing results yet
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Run an indexing operation to see results here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Information Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            <strong>File Naming Convention:</strong> Files should follow the pattern 
            <code className="mx-1 px-1 bg-zinc-100 dark:bg-zinc-800 rounded">[username]_[code].ext</code> 
            for proper ownership assignment.
          </AlertDescription>
        </Alert>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Duplicate Handling:</strong> If a file with the same name already exists 
            in the target directory, it will be renamed with a suffix like (1), (2), etc.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
